'use strict';
const expect = require('chai').expect;
const should = require('chai').should;
const sinon = require('sinon');
const Serverless = require('serverless/lib/Serverless');
const CLI = require('serverless/lib/classes/CLI');
const StepFunctionsOfflinePlugin = require('../index');

describe('index.js', () => {
    global.hooks = {
        start: 'step-functions-offline:start',
        isInstalledPluginSLSStepFunctions: 'step-functions-offline:isInstalledPluginSLSStepFunctions',
        findState: 'step-functions-offline:findState',
        findFunctionsPathAndHandler: 'step-functions-offline:findFunctionsPathAndHandler',
        loadEventFile: 'step-functions-offline:loadEventFile',
        loadEnvVariables: 'step-functions-offline:loadEnvVariables',
        buildStepWorkFlow: 'step-functions-offline:buildStepWorkFlow'
    };

    const options = {
        stateMachine: 'foo',
        s: 'foo',
        event: null,
        location: './tests'
    };
    const serverless = new Serverless();
    serverless.cli = new CLI();
    // serverless.setProvider('aws', new AwsProvider(serverless));
    serverless.service.functions = {
        "firstLambda": {
            "handler": "examples/firstLambda/index.handler",
            "name": "TheFirstLambda"
        }
    }
    global.stepFunctionsOfflinePlugin = new StepFunctionsOfflinePlugin(serverless, options);

    beforeEach(() => {

    });

    afterEach(() => {
        // sandbox.restore();
    });

    describe('Constructor()', () => {
        it('should have hooks', () => expect(stepFunctionsOfflinePlugin.hooks).to.be.not.empty);

        it('should have commands', () => expect(stepFunctionsOfflinePlugin.commands).to.be.not.empty);
    });

    describe('#checkVariableInYML', () => {
        it('should throw error - custom.stepFunctionsOffline does not exist', () => {
            expect(stepFunctionsOfflinePlugin.hooks[hooks.start]).to.throw(/ENV_VARIABLES/);
        });

        it('should exists custom.stepFunctionsOffline', () => {
            stepFunctionsOfflinePlugin.serverless.service.custom = {
                stepFunctionsOffline: {FirstLambda: 'firstLamda/index.handler'}
            };
            expect(stepFunctionsOfflinePlugin.hooks[hooks.start]).to.not.throw();
        });

    });

    describe('#start', () => {
        it('should run function without error', () => {
            expect(stepFunctionsOfflinePlugin.hooks[hooks.start]).to.not.throw();
        });

        it('should throw err - unsupportable serverless version', () => {
            const version = '0.5';
            stepFunctionsOfflinePlugin.serverless.version = version;
            const error = `Serverless step offline requires Serverless v1.x.x but found ${version}`;
            expect(stepFunctionsOfflinePlugin.hooks[hooks.start]).to.throw(error);
        });

        it('should be acceptable serverless version', () => {
            const version = '1.14';
            stepFunctionsOfflinePlugin.serverless.version = version;
            expect(stepFunctionsOfflinePlugin.hooks[hooks.start]).to.not.throw();
        });

    });

    describe('#isInstalledPluginSLSStepFunctions', () => {
        it('should throw err: sls step functions plugin does not installed', () => {
            const error = 'Error: Please install plugin "serverless-step-functions". Package does not work without it';
            expect(stepFunctionsOfflinePlugin.hooks[hooks.isInstalledPluginSLSStepFunctions]).to.throw(error);
        });

        it('should accept it - package exists', () => {
            stepFunctionsOfflinePlugin.serverless.service.plugins = ['serverless-step-functions'];
            expect(stepFunctionsOfflinePlugin.hooks[hooks.isInstalledPluginSLSStepFunctions]).to.not.throw();
        });
    });


    describe('#loadEventFile', () => {
        it('should return empty object', () => {
            const result = stepFunctionsOfflinePlugin.hooks[hooks.loadEventFile]();
            expect(result).to.be.empty;
            expect(result).to.be.a('object');
        });

        it('should apply event file ', () => {
            const SFOP = new StepFunctionsOfflinePlugin(serverless, {e: 'tests/eventFile.json'});
            const result = SFOP.hooks[hooks.loadEventFile]();
            expect(SFOP.eventFile).to.own.include({foo: 1, bar: 2});
        });

        it('should throw error - incorrect path to event file ', () => {
            const SFOP = new StepFunctionsOfflinePlugin(serverless, {event: '..tests/eventFile.json'});
            expect(SFOP.hooks[hooks.loadEventFile]).to.throw(/Cannot find module/);
        });
    })


    describe('#loadEnvVariables', () => {
        it('should return empty object', () => {
            const result = stepFunctionsOfflinePlugin.hooks[hooks.loadEnvVariables]();
            expect(result).to.be.undefined;
        });

    });

    describe('#findState', () => {
        it('should throw err - serverless.yml not exists', () => {
            // stepFunctionsOfflinePlugin.serverless.config = process.cwd() + '/serverless.test.yml';
            expect(stepFunctionsOfflinePlugin.hooks[hooks.findState]).to.throw('Could not find serverless.yml');
        });


        it('should throw error - incorrect path to event file ', () => {
            const SFOP = new StepFunctionsOfflinePlugin(serverless, {event: '..tests/eventFile.json'});
            expect(SFOP.hooks[hooks.loadEventFile]).to.throw(/Cannot find module/);
        });

        it('should throw err - state does not exist', () => {
            stepFunctionsOfflinePlugin.stateMachine = undefined;
            const error = 'State Machine undefined does not exist in yaml file';
            stepFunctionsOfflinePlugin.serverless.config.servicePath = process.cwd() + '/tests';
            return stepFunctionsOfflinePlugin.hooks[hooks.findState]()
                .catch(err => expect(err).to.be.an('error'))
        });

        it('should parse serverless.yml and find state', () => {
            stepFunctionsOfflinePlugin.stateMachine = 'foo';
            stepFunctionsOfflinePlugin.serverless.config.servicePath = process.cwd();
            return stepFunctionsOfflinePlugin.hooks[hooks.findState]()
                .then(() => {
                    expect(stepFunctionsOfflinePlugin.stateDefinition).to.have.property('Comment')
                })
                .catch(err => {
                    expect(err).to.be.an('undefined')
                })
        });
    })
});
