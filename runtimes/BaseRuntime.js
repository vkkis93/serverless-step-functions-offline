'use strict';

/**
 * Base class for runtime environments for lambda functions
 */
class BaseRuntime {
    /**
     * @param {obj} functionDefinition The Function definition used for the handler
     * @param {obj} serverless Reference to the serverless object
     * @param {string} location The root location of the application
     * @param {string} handlerName The name of the handler to try to invoke
     */
    constructor(functionDefinition, serverless, location, handlerName) {
        this.location = location;
        this.functionDefinition = functionDefinition;
        this.serverless = serverless;
        this.handlerName = handlerName;
        this.verbose = false;
    }

    /**
     * This method needs to be implemented for running the lambda in a specific runtime context
     *
     * @param {obj} event The event object to pass to the lambda
     * @param {obj} context The context object to pass to the lambda
     * @param {callback} done The standard lambda callback to return state to after execution or error
     */
    getExec(event, context, done) {
        throw new Error('Invalid call to BaseRuntime.getExec runtime specicic code must be implemented');
    }
}

module.exports = BaseRuntime;

