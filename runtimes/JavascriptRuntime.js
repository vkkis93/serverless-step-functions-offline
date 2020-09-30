'use strict';

const BaseRuntime = require('./BaseRuntime');
const _ = require('lodash');
const path = require('path');

class JavascriptRuntime extends BaseRuntime {
    getFunction() {
        const dir = path.dirname(this.functionDefinition.handler);
        const handler = path.basename(this.functionDefinition.handler);
        const splitHandler = handler.split('.');
        const filePath = `${dir}/${splitHandler[0]}.js`;
        return require(path.join(this.location, filePath))[handler];
    }

    getExec(event, context, done) {
        const func = this.getFunction();
        if (this.functionDefinition.environment) {
            process.env = _.extend(process.env, this.functionDefinition.environment);
        }

        return func(event, context, done);
    }
}

module.exports = JavascriptRuntime;
