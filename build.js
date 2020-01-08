'use strict';
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const enumList = require('./enum');

module.exports = {
  _findFunctionPathAndHandler(functionHandler) {
    const dir = path.dirname(functionHandler);
    const handler = path.basename(functionHandler);
    const splitHandler = handler.split('.');
    const filePath = `${dir}/${splitHandler[0]}.js`;
    const handlerName = `${splitHandler[1]}`;

    return { handler: handlerName, filePath };
  },

  buildStepWorkFlow() {
    this.cliLog('Building StepWorkFlow');
    this.states = this.stateDefinition.States;

    return this.process(this.states[this.stateDefinition.StartAt], this.stateDefinition.StartAt, this.eventFile, this.states)
  },

  async process(state, stateName, event, states) {
    const data = this._states(state, stateName, states);

    if (data.choice) {
      return this._runChoice(data, event, states);
    } else if (data.branches) {
      const branches = [];
      for (const branch of data.branches) {
        branches.push(this.process(branch.States[branch.StartAt], branch.StartAt, event, branch.States));
      }
      const results = await Promise.all(branches);
      return this.process(states[state.Next], state.Next, results, states);
    } else {
      return this._run(data.f(event), event, data.context, stateName);
    }
  },

  async _run(f, event, context, stateName) {
    if (!f) {
      return Promise.resolve();
    }
    this.executionLog(`~~~~~~~~~~~~~~~~~~~~~~~~~~~ ${stateName} started ~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
    return new Promise((resolve, reject) => {
      this._callF(f, event, resolve, reject, context);
    });
  },

  async _callF(f, event, resolve, reject, context) {
    let called = false;
    const callb = (err, data) => {
      called = true;
      if (err) {
        reject(err);
      } else if (context) {
        context.done(err, data).then(() => resolve(data));
      } else {
        resolve(data);
      }
    };
    let result = await f(event, {
      cb: callb,
      done: callb,
      succeed: (result) => callb(null, result),
      fail: (err) => callb(err),
    }, callb);
    if (!called) {
      context.done(null, result).then(() => resolve(result));
    }
  },

  _states(currentState, currentStateName, States) {
    if (!currentState) currentState = { Type: 'Pass' }
    switch (currentState.Type) {
      case 'Task': // just push task to general array
        //before each task restore global default env variables
        process.env = Object.assign({}, this.environmentVariables);
        let f = this.variables[currentStateName];
        f = this.functions[f];
        if (!f) {
          this.cliLog(`Function "${currentStateName}" does not presented in serverless.yml`);
          process.exit(1);
        }
        const { handler, filePath } = this._findFunctionPathAndHandler(f.handler);
        // if function has additional variables - attach it to function
        if (f.environment) {
          process.env = _.extend(process.env, f.environment);
        }
        return {
          name: currentStateName,
          f: () => require(path.join(this.location, filePath))[handler],
          context: this.createContextObject(currentState.Next, States, currentStateName),
        };
      case 'Parallel': // look through branches and push all of them
        return {
          branches: currentState.Branches,
          next: currentState.Next
        };
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
        const choiceConditional = { choice: [] };
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
            compareWithValue,
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
          },
        };
      case 'Pass':
        return {
          f: (event) => {
            return (arg1, arg2, cb) => {
              this.cliLog('!!! Pass State !!!');
              const eventResult = this._passStateFields(currentState, event);
              cb(null, eventResult);

            };
          },
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
      return currentState.Result || event;
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

  async _runChoice(data, event, states) {
    let existsAnyMatches = false;

    //look through choice and find appropriate
    for (let i = 0; i < data.choice.length; i++) {
      const choice = data.choice[i];
      //check if result from previous function has of value which described in Choice
      const functionResultValue = _.get(event, choice.variable);
      if (!_.isNil(functionResultValue)) {
        //check condition
        const isConditionTrue = choice.checkFunction(functionResultValue, choice.compareWithValue);
        if (isConditionTrue) {
          existsAnyMatches = true;
          return this.process(states[choice.choiceFunction], choice.choiceFunction, event, states);
        }
      }
    }

    if (!existsAnyMatches && data.defaultFunction) {
      const fName = data.defaultFunction;
      return this.process(states[fName], fName, event, states);
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

  createContextObject(Next, States, Finished) {
    const cb = (err, result) => {
      if (err) {
        throw `Error in function "${this.currentStateName}": ${JSON.stringify(err)}`;
      }
      this.executionLog(`~~~~~~~~~~~~~~~~~~~~~~~~~~~ ${Finished} finished ~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
      return this.process(States[Next], Next, result, States);
    };

    return { done: cb };
  },

  executionLog(log) {
    if (this.detailedLog) this.cliLog(log);
  },
};
