'use strict';
const parse = require('./parse');
const build = require('./build');
const _ = require('lodash');
const path = require('path');

class StepFunctionsOfflinePlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.stateMachine = this.options.stateMachine || this.options.s;
        this.eventFile = this.options.event || this.options.e;
        if (!_.has(this.serverless.service, 'custom.stepFunctionsOffline')) {
            throw new this.serverless.classes.Error('Please add ENV_VARIABLES to section "custom"');
        }
        this.variables = this.serverless.service.custom.stepFunctionsOffline;
        this.cliLog = this.serverless.cli.log.bind(this.serverless.cli);
        Object.assign(this,
            parse,
            build
        );
        this.commands = {
            'step-functions-offline': {
                usage: 'Will run your step function locally',
                lifecycleEvents: [
                    'start',
                    'isInstalledPluginSLSStepFunctions',
                    'findFunctionsPathAndHandler',
                    'findState',
                    'loadEventFile',
                    'buildStepWorkFlow'
                ],
                options: {
                    stateMachine: {
                        usage: 'The stage used to execute.',
                        shortcut: 's',
                        required: true
                    },
                    event: {
                        usage: 'File where is values for execution in JSON format',
                        shortcut: 'e'
                    }
                }
            }

        };

        this.hooks = {
            'step-functions-offline:start': this.start.bind(this),
            'step-functions-offline:isInstalledPluginSLSStepFunctions': this.isInstalledPluginSLSStepFunctions.bind(this),
            'step-functions-offline:findState': this.findState.bind(this),
            'step-functions-offline:findFunctionsPathAndHandler': this.findFunctionsPathAndHandler.bind(this),
            'step-functions-offline:loadEventFile': this.loadEventFile.bind(this),
            'step-functions-offline:buildStepWorkFlow': this.buildStepWorkFlow.bind(this)
        };
    }

    // Entry point for the plugin (sls step offline)
    start() {
        this.cliLog('Preparing....');
        process.env.STEP_IS_OFFLINE = true;
        this._checkVersion();
    }

    _checkVersion() {
        const version = this.serverless.version;
        if (!version.startsWith('1.')) {
            this.cliLog(`Serverless step offline requires Serverless v1.x.x but found ${version}`);
            process.exit(0);
        }
    }

    findState() {
        this.cliLog('Parse serverless.yml:');
        this.cliLog(`Trying to find state ${this.stateMachine} in serverless.yml`);
        return this.yamlParse()
            .then((yaml) => {
                this.stateDefinition = this._findState(yaml, this.stateMachine);
                return;
            }).catch(err => {
                throw new this.serverless.classes.Error(err);
            });
    }

    isInstalledPluginSLSStepFunctions() {
        const plugins = this.serverless.service.plugins;
        if (plugins.indexOf('serverless-step-functions') < 0) {
            this.cliLog('Error: Please install plugin "serverless-step-functions". Package does not work without it');
            process.exit(1);
        }
    }

    loadEventFile() {
        if (!this.eventFile) return this.eventFile = {};
        try {
            const event = require(path.join(process.cwd(), this.eventFile));
            this.eventFile = event;
        } catch (err) {
            throw err;
        }
    }

    _findState(yaml, stateMachine) {
        if (!_.has(yaml, 'stepFunctions.stateMachines') || !yaml.stepFunctions.stateMachines[stateMachine]) {
            this.cliLog(`State Machine ${stateMachine} does not exist in yaml file`);
            process.exit(0);
        }
        return yaml.stepFunctions.stateMachines[stateMachine].definition;
    }
}

module.exports = StepFunctionsOfflinePlugin;
