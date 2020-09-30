'use strict';

const JavascriptRuntime = require('./JavascriptRuntime');
const Python3Runtime = require('./Python3Runtime');

// Define mapping between regexes for runtimes and the associated classes
const CLASS_MAPPINGS = [
    {
        match: /nodejs/,
        class: JavascriptRuntime
    },
    {
        match: /python3/,
        class: Python3Runtime
    }
];

/**
 * Attempts to find a runtime for a given set of code
 * @param {string} runtimeDefinition The string definiton for the runtime
 * {@see https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html} under identifiers for valid values
 * @returns {obj} The associated runtime
 */
module.exports = function(runtimeDefinition) {
    for (const mapping of CLASS_MAPPINGS) {
        if (mapping.match.test(runtimeDefinition)) {
            return mapping.class;
        }
    }

    throw new Error(`No runtime environment found for: ${runtimeDefinition}`);
};
