'use strict';
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const enumList = require('./enum');

module.exports = {

    // findFunctionsPathAndHandler() {
    //     for (const functionName in this.variables) {
    //         const functionHandler = this.variables[functionName];
    //         const {handler, filePath} = this._findFunctionPathAndHandler(functionHandler);
    //
    //         this.variables[functionName] = {handler, filePath};
    //     }
    //     console.log('this.va', this.variables)
    // },
    //
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
        this.states = this.stateDefinition.States;

        return Promise.resolve()
            .then(() => this.process(this.states[this.stateDefinition.StartAt], this.stateDefinition.StartAt, this.eventFile))
            .catch(err => {
                // console.log('OOPS', err.stack);
                // this.cliLog(err);
                throw err;
            });
    },

    process(state, stateName, event) {
        if (state && state.Type === 'Parallel') {
            this.eventForParallelExecution = event;
        }
        const data = this._findStep(state, stateName);
        // if (data instanceof Promise) return Promise.resolve();
        if (!data || data instanceof Promise) {
            if (!state || state.Type !== 'Parallel') {
                this.cliLog('Serverless step function offline: Finished');
            }
            return Promise.resolve();
        }
        if (data.choice) {
            return this._runChoice(data, event);
        } else {
            return this._run(data.f(event), event);
        }
    },

    _findStep(currentState, currentStateName) {
        // it means end of states
        if (!currentState) {
            this.currentState = null;
            this.currentStateName = null;
            return;
        }
        this.currentState = currentState;
        this.currentStateName = currentStateName;
        return this._states(currentState, currentStateName);
    },

    _run(f, event) {
        if (!f) {
            return;
        }// end of states
        this.executionLog(`~~~~~~~~~~~~~~~~~~~~~~~~~~~ ${this.currentStateName} started ~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        f(event, this.contextObject, this.contextObject.done);

    },

    _states(currentState, currentStateName) {
        switch (currentState.Type) {
        case 'Task': // just push task to general array
            //before each task restore global default env variables
            process.env = Object.assign({}, this.environmentVariables);
            const functionN = currentState.Resource.split(':');
            const functionName = functionN[functionN.length - 1];
            // let f = this.variables[currentStateName];
            const f = this.functions[functionName];
            if (!f) {
                this.cliLog(`Function "${currentStateName}" does not presented in serverless.yml`);
                process.exit(1);
            }
            const {handler, filePath} = this._findFunctionPathAndHandler(f.handler);
            // if function has additional variables - attach it to function
            if (f.environment) {
                process.env = _.extend(process.env, f.environment);
            }
            return {
                name: currentStateName,
                f: () => require(path.join(this.location, filePath))[handler]
            };
        case 'Parallel': // look through branches and push all of them
            this.eventParallelResult = [];
            _.forEach(currentState.Branches, (branch) => {
                this.parallelBranch = branch;
                return this.process(branch.States[branch.StartAt], branch.StartAt, this.eventForParallelExecution);
            });
            this.process(this.states[currentState.Next], currentState.Next, this.eventParallelResult);
            delete this.parallelBranch;
            delete this.eventParallelResult;
            return;
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
                choiceObj.choiceFunction = choice.Next;
                choiceConditional.choice.push(choiceObj);
            });
            // if exists default function - store it
            if (currentState.Default) {
                choiceConditional.defaultFunction = currentState.Default;
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
            return {
                f: (event) => {
                    return (arg1, arg2, cb) => {
                        this.cliLog('!!! Pass State !!!');
                        const eventResult = this._passStateFields(currentState, event);
                        cb(null, eventResult);

                    };
                }
            };

        case 'Succeed':
            this.cliLog('Succeed');
            return Promise.resolve('Succeed');
        case 'Fail':
            const obj = {};
            if (currentState.Cause) obj.Cause = currentState.Cause;
            if (currentState.Error) obj.Error = currentState.Error;
            this.cliLog('Fail');
            if (!_.isEmpty(obj)) {
                this.cliLog(JSON.stringify(obj));
            }
            return Promise.resolve('Fail');
        }
        return;
    },

    _passStateFields(currentState, event) {
        if (!currentState.ResultPath) {
            if (!currentState.Result) {
                return event;
            }
            return currentState.Result;
        } else {
            const variableName = currentState.ResultPath.split('$.')[1];
            if (!currentState.Result) {
                event[variableName] = event;
                return event;
            }
            event[variableName] = currentState.Result;
            return event;
        }
    },

    _runChoice(data, result) {
        let existsAnyMatches = false;

        //look through choice and find appropriate
        _.forEach(data.choice, choice => {
            //check if result from previous function has of value which described in Choice
            if (!_.isNil(result[choice.variable])) {
                //check condition
                const isConditionTrue = choice.checkFunction(result[choice.variable], choice.compareWithValue);
                if (isConditionTrue) {
                    existsAnyMatches = true;
                    return this.process(this.states[choice.choiceFunction], choice.choiceFunction, result);
                }
            }
        });
        if (!existsAnyMatches && data.defaultFunction) {
            const fName = data.defaultFunction;
            return this.process(this.states[fName], fName, result);
        }
    },

    _waitState(event, currentState, currentStateName) {
        let waitTimer = 0, targetTime, timeDiff;
        const currentTime = moment();
        const waitListKeys = ['Seconds', 'Timestamp', 'TimestampPath', 'SecondsPath'];
        const waitField = _.omit(currentState, 'Type', 'Next', 'Result');
        const waitKey = Object.keys(waitField)[0];
        if (!waitListKeys.includes(waitKey)) {
            const error = `Plugin does not support wait operator "${waitKey}"`;
            throw new this.serverless.classes.Error(error);
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
                const error =
                    `An error occurred while executing the state ${currentStateName}. 
                     The TimestampPath parameter does not reference an input value: ${waitField['TimestampPath']}`;
                throw new this.serverless.classes.Error(error);
            }
            targetTime = moment(event[timestampPath]);
            timeDiff = targetTime.diff(currentTime, 'seconds');
            if (timeDiff > 0) waitTimer = timeDiff;
            break;
        case 'SecondsPath':
            const secondsPath = waitField['SecondsPath'].split('$.')[1];
            const waitSeconds = event[secondsPath];
            if (!waitSeconds) {
                const error = `
                    An error occurred while executing the state ${currentStateName}. 
                    The TimestampPath parameter does not reference an input value: ${waitField['SecondsPath']}`;
                throw new this.serverless.classes.Error(error);
            }
            waitTimer = waitSeconds;
            break;
        }
        return waitTimer;
    },

    createContextObject() {
        const cb = (err, result) => {
            // return new Promise((resolve, reject) => {
            if (err) {
                throw `Error in function "${this.currentStateName}": ${JSON.stringify(err)}`;
            }
            this.executionLog(`~~~~~~~~~~~~~~~~~~~~~~~~~~~ ${this.currentStateName} finished ~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
            let state = this.states;
            if (this.parallelBranch && this.parallelBranch.States) {
                state = this.parallelBranch.States;
                if (!this.currentState.Next) this.eventParallelResult.push(result); //it means the end of execution of branch
            }
            this.process(state[this.currentState.Next], this.currentState.Next, result);
            // return resolve();
            // });
        };

        return {
            cb: cb,
            done: cb,
            succeed: (result) => cb(null, result),
            fail: (err) => cb(err)
        };

    },

    executionLog(log) {
        if (this.detailedLog) this.cliLog(log);
    }
};
