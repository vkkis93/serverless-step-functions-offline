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
    constructor(functionDefinition, serverless, location, handlerName){
        this.location = location
        this.functionDefinition = functionDefinition
        this.serverless = serverless
        this.handlerName = handlerName
    }

    /**
     * 
     * @param {obj} event The event object to pass to the lambda
     * @param {obj} context The context object to pass to the lambda
     * @param {callback} done 
     * @returns {obj}
     * @returns {obj.f} The function to execute during the runtime step
     */
    exec(event, context, done){
        throw new Error("Needs to be implemented!")
    }    
}

module.exports = BaseRuntime

