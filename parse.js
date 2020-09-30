'use strict';
const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');

module.exports = {
    getRawConfig() {
        const serverlessPath = this.serverless.config.servicePath;
        if (!serverlessPath) {
            throw new this.serverless
                .classes.Error('Could not find serverless manifest');
        }

        const manifestFilenames = [
            'serverless.yaml',
            'serverless.yml',
            'serverless.json',
            'serverless.js',
        ];

        const manifestFilename = manifestFilenames.map((filename) => path.join(serverlessPath, filename))
            .find((filename) => this.serverless.utils.fileExistsSync(filename));

        if (!manifestFilename) {
            throw new this.serverless.classes.Error('Could not find serverless manifest');
        }

        if (/\.json|\.js$/.test(manifestFilename)) {
            return Promise.resolve(require(manifestFilename));
        }

        return this.serverless.yamlParser.parse(manifestFilename);
    },

    parseConfig() {
        return this.getRawConfig()
            .then((serverlessFileParam) => {
                this.serverless.service.stepFunctions = {};
                this.serverless.service.stepFunctions.stateMachines
                    = serverlessFileParam.stepFunctions
                && serverlessFileParam.stepFunctions.stateMachines
                        ? serverlessFileParam.stepFunctions.stateMachines : {};
                this.serverless.service.stepFunctions.activities
                    = serverlessFileParam.stepFunctions
                && serverlessFileParam.stepFunctions.activities
                        ? serverlessFileParam.stepFunctions.activities : [];

                if (!this.serverless.pluginManager.cliOptions.stage) {
                    this.serverless.pluginManager.cliOptions.stage = this.options.stage
                        || (this.serverless.service.provider && this.serverless.service.provider.stage)
                        || 'dev';
                }

                if (!this.serverless.pluginManager.cliOptions.region) {
                    this.serverless.pluginManager.cliOptions.region = this.options.region
                        || (this.serverless.service.provider && this.serverless.service.provider.region)
                        || 'us-east-1';
                }

                this.serverless.runtime = _.get(serverlessFileParam, ['provider', 'runtime']) || 'nodejs12.x';

                this.serverless.variables.populateService(this.serverless.pluginManager.cliOptions);
                return Promise.resolve();
            });
    },

    getStateMachine(stateMachineName) {
        if (stateMachineName in this.serverless.service.stepFunctions.stateMachines) {
            return this.serverless.service.stepFunctions.stateMachines[stateMachineName];
        }
        throw new this.serverless.classes
            .Error(`stateMachine "${stateMachineName}" doesn't exist in this Service`);
    }

};
