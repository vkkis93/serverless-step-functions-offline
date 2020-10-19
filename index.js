'use strict';
const parse = require('./parse');
const build = require('./build');
const _ = require('lodash');
const path = require('path');

class StepFunctionsOfflinePlugin {
    constructor(serverless, options) {
        this.location = process.cwd();
        this.serverless = serverless;
        this.options = options;
        this.stateMachine = this.options.stateMachine;
        this.detailedLog = this.options.detailedLog || this.options.l;
        this.eventFile = this.options.event || this.options.e;
        this.functions = this.serverless.service.functions;
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
                    'checkVariableInYML',
                    'start',
                    'isInstalledPluginSLSStepFunctions',
                    'findFunctionsPathAndHandler',
                    'findState',
                    'loadEventFile',
                    'loadEnvVariables',
                    'buildStepWorkFlow'
                ],
                options: {
                    stateMachine: {
                        usage: 'The stage used to execute.',
                        required: true
                    },
                    event: {
                        usage: 'File where is values for execution in JSON format',
                        shortcut: 'e'
                    },
                    detailedLog: {
                        usage: 'Option which enables detailed logs',
                        shortcut: 'l'
                    }
                }
            }

        };

        this.hooks = {
            'step-functions-offline:start': this.start.bind(this),
            'step-functions-offline:isInstalledPluginSLSStepFunctions': this.isInstalledPluginSLSStepFunctions.bind(this),
            'step-functions-offline:findState': this.findState.bind(this),
            'step-functions-offline:loadEventFile': this.loadEventFile.bind(this),
            'step-functions-offline:loadEnvVariables': this.loadEnvVariables.bind(this),
            'step-functions-offline:buildStepWorkFlow': this.buildStepWorkFlow.bind(this)
        };
    }

    // Entry point for the plugin (sls step offline)
    start() {
        this.cliLog('Preparing....');

        this._getLocation();
        this._checkVersion();
        this._checkVariableInYML();

    }


    _getLocation() {
        if (this.options.location) {
            this.location = path.join(process.cwd(), this.options.location);
        }
        if (this.variables && this.variables.location) {
            this.location = path.join(process.cwd(), this.variables.location);
        }
    }

    _checkVersion() {
        const version = this.serverless.version;
        if (!version.startsWith('1.') && !version.startsWith('2.')) {
            throw new this.serverless.classes.Error(`Serverless step offline requires Serverless v1.x.x or v2.x.x but found ${version}`);
        }
    }

    _checkVariableInYML() {
        if (!_.has(this.serverless.service, 'custom.stepFunctionsOffline')) {
            throw new this.serverless.classes.Error('Please add ENV_VARIABLES to section "custom"');
        }
        return;
    }

    isInstalledPluginSLSStepFunctions() {
        const plugins = this.serverless.service.plugins;
        if (plugins.indexOf('serverless-step-functions') < 0) {
            const error = 'Error: Please install plugin "serverless-step-functions". Package does not work without it';
            throw new this.serverless.classes.Error(error);
        }
    }

    loadEventFile() {
        if (!this.eventFile) {
            return this.eventFile = {};
        }
        try {
            this.eventFile = path.isAbsolute(this.eventFile) ? require(this.eventFile) :
                require(path.join(process.cwd(), this.eventFile));
        } catch (err) {
            throw err;
        }
    }

    loadEnvVariables() {
        this.environment = this.serverless.service.provider.environment;
        process.env.STEP_IS_OFFLINE = true;
        process.env = _.extend(process.env, this.environment);
        this.environmentVariables = Object.assign({}, process.env); //store global env variables;
        return;
    }

    findState() {
        this.cliLog(`Trying to find state "${this.stateMachine}" in serverless manifest`);
        return this.parseConfig()
            .then(() => {
                this.stateDefinition = this.getStateMachine(this.stateMachine).definition;
            }).catch(err => {
                throw new this.serverless.classes.Error(err);
            });
    }

}

module.exports = StepFunctionsOfflinePlugin;
