'use strict';
const expect = require('chai').expect;
const should = require('chai').should;
const sinon = require('sinon');
const Serverless = require('serverless/lib/Serverless');
const CLI = require('serverless/lib/classes/CLI');


describe('build.js', () => {
    describe('#findFunctionsPathAndHandler()', () => {

        it('should parse path - not deep level', () => {
            stepFunctionsOfflinePlugin.variables = {FirstLambda: 'firstLambda/index.handler'};
            stepFunctionsOfflinePlugin.hooks[hooks.findFunctionsPathAndHandler]();
            expect(stepFunctionsOfflinePlugin.variables)
                .to.deep.include({FirstLambda: {handler: 'handler', filePath: 'firstLambda/index.js'}})
        });

        // it('should throw err - can not find module', (done) => {
        //     stepFunctionsOfflinePlugin.hooks[hooks.buildStepWorkFlow]()
        //         .then((res) => {
        //             expect(res).to.be.an('undefined')
        //         })
        //         .catch((err) => {
        //             expect(err).to.throw(/Cannot find module/);
        //         }).finally(done);
        //
        // });

        it('should parse path - deep level case', () => {
            stepFunctionsOfflinePlugin.variables = {FirstLambda: 'examples/firstLambda/index.handler'};
            stepFunctionsOfflinePlugin.hooks[hooks.findFunctionsPathAndHandler]();
            expect(stepFunctionsOfflinePlugin.variables)
                .to.deep.include({FirstLambda: {handler: 'handler', filePath: 'examples/firstLambda/index.js'}})
        });

        it('should throw err - TRUE', () => {
            stepFunctionsOfflinePlugin.hooks[hooks.buildStepWorkFlow]()
                .then((res) => {
                    console.log('!!!!!!', res)
                })
                .catch((err) => {
                    console.log('@@@@@@', err)
                });

        });

    });

    // describe('#buildStepWorkFlow()', () => {
    //
    //
    //
    // });
});