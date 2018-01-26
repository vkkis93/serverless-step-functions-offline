'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');
const Serverless = require('serverless/lib/Serverless');
const AwsProvider = require('serverless/lib/plugins/aws/provider/awsProvider');
const CLI = require('serverless/lib/classes/CLI');
const StepFunctionsOfflinePlugin = require('../index');

describe('index.js', () => {


    let sandbox;
    const options = {
        stateMachine: 'foo',
        s: 'foo',
        event: null
    };
    let serverless = new Serverless();
    serverless.cli = new CLI();
    serverless.setProvider('aws', new AwsProvider(serverless));
    const stepFunctionsOfflinePlugin = new StepFunctionsOfflinePlugin(serverless, options);

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
            expect(stepFunctionsOfflinePlugin.hooks['before:step-functions-offline:start']).to.throw(/ENV_VARIABLES/);
        });

        it('should exists custom.stepFunctionsOffline', () => {
            stepFunctionsOfflinePlugin.serverless.service.custom = {
                stepFunctionsOffline: {Foo: 'bar'}
            };
            expect(stepFunctionsOfflinePlugin.hooks['before:step-functions-offline:start']).to.not.throw();
        });

    });

    describe('#start', () => {
        it('should run function without error', () => {
            expect(stepFunctionsOfflinePlugin.hooks['step-functions-offline:start']).to.not.throw();
        });

        it('should throw err - unsupportable serverless version', () => {
            const version = '0.5';
            stepFunctionsOfflinePlugin.serverless.version = version;
            const error = `Serverless step offline requires Serverless v1.x.x but found ${version}`;
            expect(stepFunctionsOfflinePlugin.hooks['before:step-functions-offline:start']).to.equal(0);
        });

        it('should be acceptable serverless version', () => {
            const version = '1.14';
            stepFunctionsOfflinePlugin.serverless.version = version;
            expect(stepFunctionsOfflinePlugin.hooks['before:step-functions-offline:start']).to.not.throw();
        });

    });
});
