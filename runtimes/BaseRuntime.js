/**
 * Base class for runtime environments for lambda functions
 */
class BaseRuntime {
    /**
     * @param {string} location The root location of the application
     * @param {string} handlerPath The path given by the handler so that certain parts can be ececuted in order
     * @param {obj} environment The context to execute the function in
     */
    constructor(location, handlerPath, environment){
        this.location = location
        this.handlerPath = handlerPath
        this.environment = environment
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

