# serverless-step-offline.
# Currently in beta, but you can play with it.
# IMPORTANT: This plugin works only with runtime *node.js* and only with callback. It does not work with context object.

# Install
using npm:
```bash
npm install serverless-step-functions-offline --save-dev
```
or yarn:
```bash
yarn serverless-step-functions-offline
```

# Setup
Add the plugin to your serverless.yml
```yaml
# serverless.yml

plugins:
  - serverless-step-functions-offline
```

To verify that the plugin works, run this in your command line:
```bash
sls step-functions-offline
```

# Requirements
This plugin works only with [serverless-step-functions](https://github.com/horike37/serverless-step-functions).
You must have this plugin installed and correctly specified statemachine definition using Amazon States Language.
Example of statemachine definition you can see [here](https://github.com/horike37/serverless-step-functions#setup)
# Usage
After all steps are done, need to add to section **custom** in serverless.yml the key **stepFunctionsOffline** with properties *stateName*: path to lambda function.
For Example
```sh
service: ServerlessStepPlugin
frameworkVersion: ">=1.13.0 <2.0.0"
plugins:
   - serverless-step-functions-offline
...

custom:
  stepFunctionsOffline:
    FirstLambda: firstLambda/index.handler
    ...
    ...
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
Where *FirstLambda* is the name of step in state machine
The *firstLambda/index.handler* - it's path to lambda

# Run Plugin
```sh
 sls step-functions-offline --stateMachine={{name}} --event={{path to event file}}
```
 *name* - name of state machine in section state functions. In example above it's **foo**
 
 *event file* - input values for execution in JSON format (optional)

If you want to know where you are (in offline mode or not) you can use env variable  **STEP_IS_OFFLINE**.
Be default **process.env.STEP_IS_OFFLINE = true**

# What does plugin support ?
| States | Support |
| ------ | ------ |
| ***Task*** | At this moment  plugin **does not support fields** *Retry*, *Catch*, *TimeoutSeconds*, *HeartbeatSeconds*
| ***Wait***  | All following fields: *Seconds*, *SecondsPath*, *Timestamp*, *TimestampPath* |
| ***Choice*** | All comparison operators except: *And*, *Not*, *Or*|
| ***Pass*** | * |
| ***Parallel*** |  Only *Branches*

### Future plans
 - Support context object
 - Support fields *Retry*, *Catch*
 - Support other languages except node.js
 - Improve performance
 - Bug Fixing

If you have any questions please feel free to contact me: vkkis1993@gmail.com

License
----

MIT

