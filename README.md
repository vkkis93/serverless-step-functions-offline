[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm version](https://badge.fury.io/js/serverless-step-functions-offline.svg)](https://badge.fury.io/js/serverless-step-functions-offline)
[![Known Vulnerabilities](https://snyk.io/test/github/vkkis93/serverless-step-functions-offline/badge.svg?targetFile=package.json)](https://snyk.io/test/github/vkkis93/serverless-step-functions-offline?targetFile=package.json)
[![Maintainability](https://api.codeclimate.com/v1/badges/b321644ef368976aee12/maintainability)](https://codeclimate.com/github/vkkis93/serverless-step-functions-offline/maintainability)
[![NPM](https://nodei.co/npm/serverless-step-functions-offline.png)](https://nodei.co/npm/serverless-step-functions-offline/)

# serverless-step-functions-offline
:warning: Version 2.0 with breaking changes see [usage](#usage)  :warning:
## Documentation

- [Install](#install)
- [Setup](#setup)
- [Requirements](#requirements)
- [Usage](#usage)
- [Run plugin](#run-plugin)
- [What does plugin support](#what-does-plugin-support)
- [Usage with serverless-wepback](#usage-with-serverless-webpack)


# Install
Using NPM:
```bash
npm install serverless-step-functions-offline --save-dev
```
or Yarn:
```bash
yarn add serverless-step-functions-offline --dev
```

# Setup
Add the plugin to your `serverless.yml`:
```yaml
# serverless.yml

plugins:
  - serverless-step-functions-offline
```

To verify that the plugin works, run this in your command line:
```bash
sls step-functions-offline
```

It should rise an error like that:

> Serverless plugin "serverless-step-functions-offline" initialization errored: Please add ENV_VARIABLES to section "custom"

# Requirements
This plugin works only with [serverless-step-functions](https://github.com/horike37/serverless-step-functions).

You must have this plugin installed and correctly specified statemachine definition using Amazon States Language.

Example of statemachine definition you can see [here](https://github.com/horike37/serverless-step-functions#setup).

# Usage
After all steps are done, need to add to section **custom** in serverless.yml the key **stepFunctionsOffline** with properties *stateName*: name of lambda function.

For example:

```yaml
service: ServerlessStepPlugin
frameworkVersion: ">=1.13.0 <2.0.0"
plugins:
   - serverless-step-functions-offline

# ...

custom:
  stepFunctionsOffline:
    FirstLambda: firstLambda #(v2.0)
    # ...
    # ...
    SecondLambda: secondLambda #(v2.0)

functions:
    firstLambda:
        handler: firstLambda/index.handler
        name: TheFirstLambda
    secondLambda:
        handler: secondLambda/index.handler
        name: TheSecondLambda
stepFunctions:
  stateMachines:
    foo:
      definition:
        Comment: "An example of the Amazon States Language using wait states"
        StartAt: FirstLambda
        States:
            FirstLambda:
              Type: Task
              Resource: arn:aws:lambda:eu-west-1:123456789:function:TheFirstLambda
              Next: SecondLambda
            SecondLambda:
              Type: Task
              Resource: arn:aws:lambda:eu-west-1:123456789:function:TheSecondLambda
              End: true
```

Where:
- `StepOne` is the name of step in state machine
- `firstLambda` is the name of function in section **functions**

# Run Plugin
```bash
sls step-functions-offline --stateMachine={{name}} --event={{path to event file}}
```

- `name`: name of state machine in section state functions. In example above it's `foo`.
- `event`: input values for execution in JSON format (optional)

If you want to know where you are (in offline mode or not) you can use env variable `STEP_IS_OFFLINE`.

By default `process.env.STEP_IS_OFFLINE = true`.

# What does plugin support?
| States | Support |
| ------ | ------ |
| ***Task*** | At this moment  plugin **does not support fields** *Retry*, *Catch*, *TimeoutSeconds*, *HeartbeatSeconds* |
| ***Choice*** | All comparison operators except: *And*, *Not*, *Or* |
| ***Wait***  | All following fields: *Seconds*, *SecondsPath*, *Timestamp*, *TimestampPath* |
| ***Parallel*** |  Only *Branches* |
| ***Pass*** | Result, ResultPath |
| ***Fail***| Cause, Error|
| ***Succeed***| |

### Usage with serverless-webpack

The plugin integrates very well with [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack).

Add the plugins `serverless-webpack` to your `serverless.yml` file and make sure that `serverless-webpack`
precedes `serverless-step-functions-offline` as the order is important:
```yaml
  plugins:
    ...
    - serverless-webpack
    ...
    - serverless-step-functions-offline
    ...
```

### TODOs
 - [x] Support context object
 - [x] Improve performance
 - [x] Fixing bugs
 - [x] Support Pass, Fail, Succeed
 - [x] Integration with serverless-webpack
 - [ ] Add unit tests - to make plugin stable (next step)
 - [ ] Support fields *Retry*, *Catch*
 - [ ] Support other languages except node.js
