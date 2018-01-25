[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm version](https://badge.fury.io/js/serverless-step-functions-offline.svg)](https://badge.fury.io/js/serverless-step-functions-offline)
[![Known Vulnerabilities](https://snyk.io/test/github/vkkis93/serverless-step-functions-offline/badge.svg?targetFile=package.json)](https://snyk.io/test/github/vkkis93/serverless-step-functions-offline?targetFile=package.json)
[![Maintainability](https://api.codeclimate.com/v1/badges/b321644ef368976aee12/maintainability)](https://codeclimate.com/github/vkkis93/serverless-step-functions-offline/maintainability)
[![Dependency Status](https://david-dm.org/vkkis93/serverless-step-functions-offline.svg)](https://david-dm.org/vkkis93/serverless-step-functions-offline)

# serverless-step-functions-offline

## Documentation

- [Install](#install)
- [Setup](#setup)
- [Requirements](#requirements)
- [Usage](#usage)
- [Run plugin](#run-plugin)
- [What does plugin support](#what-does-plugin-support)

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
After all steps are done, need to add to section **custom** in serverless.yml the key **stepFunctionsOffline** with properties *stateName*: path to lambda function.

For example:

```yaml
service: ServerlessStepPlugin
frameworkVersion: ">=1.13.0 <2.0.0"
plugins:
   - serverless-step-functions-offline

# ...

custom:
  stepFunctionsOffline:
    FirstLambda: firstLambda/index.handler
    # ...
    # ...
    SecondLambda: myDir/index.main

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
- `FirstLambda` is the name of step in state machine
- `firstLambda/index.handler` is the path to Lambda

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
| ***Task*** | At this moment  plugin **does not support fields** *Retry*, *Catch*, *TimeoutSeconds*, *HeartbeatSeconds*
| ***Wait***  | All following fields: *Seconds*, *SecondsPath*, *Timestamp*, *TimestampPath* |
| ***Choice*** | All comparison operators except: *And*, *Not*, *Or*|
| ***Pass*** | * |
| ***Parallel*** |  Only *Branches*

### TODOs
 - [x] Support context object
 - [x] Improve performance
 - [x] Fixing bugs
 - [ ] Add unit tests - to make plugin stable (next step)
 - [ ] Support fields *Retry*, *Catch*
 - [ ] Support other languages except node.js


If you have any questions, feel free to contact me: vkkis1993@gmail.com

# License

MIT
