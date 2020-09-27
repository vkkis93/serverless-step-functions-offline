const JavascriptRuntime = require('./JavascriptRuntime')
const Python3Runtime = require('./Python3Runtime')
const BaseRuntime = require('./BaseRuntime')

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
]

/**
 * @param {string} runtimeDefinition The string definiton for the runtime {@see https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html} under identifiers for valid values
 * @returns {BaseRuntime}
 */
module.exports = function(runtimeDefinition){
    for(let mapping of CLASS_MAPPINGS){
        if(mapping.match.test(runtimeDefinition)){
            return mapping.class
        }
    }

    throw new Error(`No runtime environment found for: ${runtimeDefinition}`)
}