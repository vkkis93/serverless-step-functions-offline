'use strict';
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const enumList = require('./enum');
let steps;
// let contextObject;
let currentFunctionIndex;

module.exports = {

    findFunctionsPathAndHandler() {
        for (const functionName in this.variables) {
            const functionHandler = this.variables[functionName];
            const {handler, filePath} = this._findFunctionPathAndHandler(functionHandler);

            this.variables[functionName] = {handler, filePath};
        }
    },

    _findFunctionPathAndHandler(functionHandler) {
        const dir = path.dirname(functionHandler);
        const handler = path.basename(functionHandler);
        const splitHandler = handler.split('.');
        const filePath = `${dir}/${splitHandler[0]}.js`;
        const handlerName = `${splitHandler[1]}`;

        return {handler: handlerName, filePath};
    },

    buildStepWorkFlow() {
        this.cliLog('Building StepWorkFlow');
        this.contextObject = this.createContextObject();
        console.log('contextObject', this.contextObject);
        steps = [];
        const states = this.stateDefinition.States;

        return Promise.resolve()
            .then(() => this._findNextStep(states, states[this.stateDefinition.StartAt], this.stateDefinition.StartAt))
            .then(() => this._run(steps[0].f(), this.eventFile, 0))
            .then(() => this.cliLog('Serverless step function offline: Finished'))
            .catch(err => {
                console.log('OOPS', err.stack);
                this.cliLog(err);
                process.exit(1);
            });
    },

    _run(f, event, index) {
        // console.log('steps', steps);
        return new Promise((resolve, reject) => {
            if (!f) return resolve();// end of states
            currentFunctionIndex = index;
            f(event, this.contextObject, this.contextObject.done);
        }).catch(err => {
            throw err;
        });
    },

    _runNextStepFunction(result, index, resolve) {
        if (!steps[index]) {
            // end of states
            return resolve();
        }

        if (steps[index].choice) {
            // type: Choice
            this._runChoice(steps[index], result, resolve, index);
        } else if (steps[index].waitState) {
            //type: Wait
            return resolve(this._run(steps[index].f(result), result, index));
        } else {
            return resolve(this._run(steps[index].f(), result, index));
        }
    },

    _runChoice(typeChoice, result, resolve, index) {
        let existsAnyMatches = false;

        //look through choice and find appropriate
        _.forEach(typeChoice.choice, choice => {
            //check if result from previous function has of value which described in Choice
            if (!_.isNil(result[choice.variable])) {
                //check condition
                const isConditionTrue = choice.checkFunction(result[choice.variable], choice.compareWithValue);
                if (isConditionTrue) {
                    existsAnyMatches = true;
                    // if exists run appropriate function
                    if (!choice.f) {
                        console.log('PLEASE LOOK HERE');
                        // return resolve(this._run(steps[index + 1], result, index + 1));
                    }
                    const indexFunction = _.findIndex(steps, (step) => step.name === choice.f.name);
                    if (indexFunction > -1) {
                        return resolve(this._run(steps[indexFunction].f(), result, indexFunction));
                    } else {
                        return resolve(this._run(choice.f.f(), result, index));

                    }
                }
            }
        });
        if (!existsAnyMatches && typeChoice.defaultFunction) {
            const indexFunction = _.findIndex(steps, (step) => step.name === typeChoice.defaultFunction.name);
            if (indexFunction > -1) {
                return resolve(this._run(steps[indexFunction].f(), result, indexFunction));
            } else {
                return resolve(this._run(typeChoice.defaultFunction.f(), result, index));
            }
        }
    },

    _findNextStep(allStates, currentState, currentStateName) {
        // it means end of states
        if (!currentState) return Promise.resolve();
        const nextStateName = currentState.Next;
        if (this._switcherByType(allStates, currentState, currentStateName)) {
            steps.push(this._switcherByType(allStates, currentState, currentStateName));
            if (currentState.Type === 'Choice') {
                const stateNames = Object.keys(allStates);
                var index = stateNames.indexOf(currentStateName);
                const nextStateName = stateNames[index + 1];
                return this._findNextStep(allStates, allStates[nextStateName], nextStateName);
            }
        }
        return this._findNextStep(allStates, allStates[nextStateName], nextStateName);
    },


    _switcherByType(allStates, currentState, currentStateName) {
        switch (currentState.Type) {
        case 'Task': // just push task to general array
            return {
                name: currentStateName,
                f: () => require(path.join(process.cwd(), this.variables[currentStateName].filePath))[this.variables[currentStateName].handler]
            };
        case 'Parallel': // look through branches and push all of them
            _.forEach(currentState.Branches, (branch) => {
                this._findNextStep(branch.States, branch.States[branch.StartAt], branch.StartAt);
            });
            break;
        case 'Choice':
            //push all choices. but need to store information like
            // 1) on which variable need to look: ${variable}
            // 2) find operator: ${condition}
            // 3) find function which will check data: ${checkFunction}
            // 4) value which we will use in order to compare data: ${compareWithValue}
            // 5) find target function - will be used if condition true: ${f}
            const choiceConditional = {choice: []};
            _.forEach(currentState.Choices, (choice) => {
                const variable = choice.Variable.split('$.')[1];
                const condition = _.pick(choice, enumList.supportedComparisonOperator);
                if (!condition) {
                    this.cliLog(`Sorry! At this moment we don't support operator '${operator}'`);
                    process.exit(1);
                }
                const operator = Object.keys(condition)[0];
                const checkFunction = enumList.convertOperator[operator];
                const compareWithValue = condition[operator];

                const choiceObj = {
                    variable,
                    condition,
                    checkFunction,
                    compareWithValue
                };
                choiceObj.f = this._switcherByType(allStates, allStates[choice.Next], choice.Next);
                choiceConditional.choice.push(choiceObj);
            });
            // if exists default function - store it
            if (currentState.Default) {
                choiceConditional.defaultFunction = this._switcherByType(allStates, allStates[currentState.Default], currentState.Default);
            }
            return choiceConditional;
        case 'Wait':
            // Wait State
            // works with parameter: seconds, timestamp, timestampPath, secondsPath;
            return {
                waitState: true,
                f: (event) => {
                    const waitTimer = this._waitState(event, currentState, currentStateName);
                    this.cliLog(`Wait function ${currentStateName} - please wait ${waitTimer} seconds`);
                    return (arg1, arg2, cb) => {
                        setTimeout(() => {
                            cb(null, event);
                        }, waitTimer * 1000);
                    };
                }
            };
        case 'Pass':
            return;
        }
        return;
    },

    _waitState(event, currentState, currentStateName) {
        let waitTimer = 0, targetTime, timeDiff;
        const currentTime = moment();
        const waitListKeys = ['Seconds', 'Timestamp', 'TimestampPath', 'SecondsPath'];
        const waitField = _.omit(currentState, 'Type', 'Next', 'Result');
        const waitKey = Object.keys(waitField)[0];
        if (!waitListKeys.includes(waitKey)) {
            this.cliLog(`Plugin does not support wait operator "${waitKey}"`);
            process.exit();
        }
        switch (Object.keys(waitField)[0]) {
        case 'Seconds':
            waitTimer = waitField['Seconds'];
            break;
        case 'Timestamp':
            targetTime = moment(waitField['Timestamp']);
            timeDiff = targetTime.diff(currentTime, 'seconds');
            if (timeDiff > 0) waitTimer = timeDiff;
            break;
        case 'TimestampPath':
            const timestampPath = waitField['TimestampPath'].split('$.')[1];
            if (!event[timestampPath]) {
                this.cliLog(
                    `An error occurred while executing the state ${currentStateName}. 
                     The TimestampPath parameter does not reference an input value: ${waitField['TimestampPath']}`
                );
                process.exit(1);
            }
            targetTime = moment(event[timestampPath]);
            timeDiff = targetTime.diff(currentTime, 'seconds');
            if (timeDiff > 0) waitTimer = timeDiff;
            break;
        case 'SecondsPath':
            const secondsPath = waitField['SecondsPath'].split('$.')[1];
            const waitSeconds = event[secondsPath];
            if (!waitSeconds) {
                this.cliLog(`
                    An error occurred while executing the state ${currentStateName}. 
                    The TimestampPath parameter does not reference an input value: ${waitField['SecondsPath']}`
                );
                process.exit(1);
            }
            waitTimer = waitSeconds;
            break;
        }
        return waitTimer;
    },

    createContextObject() {
        const cb = (err, result) => {
            return new Promise((resolve, reject) => {
                if (err) {
                    throw `Error in function "${steps[currentFunctionIndex].name}": ${JSON.stringify(err)}`;
                }
                this._runNextStepFunction(result, currentFunctionIndex + 1, resolve);
            });
        };

        return {
            cb: cb,
            done: cb,
            succeed: (result) => cb(null, result),
            fail: (err) => cb(err)
        };

    }
};
