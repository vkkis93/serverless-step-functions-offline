const BaseRuntime = require('./BaseRuntime')
const _ = require('lodash');
const path = require('path')

class JavascriptRuntime extends BaseRuntime {
   getFunction() {
      const dir = path.dirname(this.handlerPath);
      const handler = path.basename(this.handlerPath);
      const splitHandler = handler.split('.');
      const filePath = `${dir}/${splitHandler[0]}.js`;
      return require(path.join(this.location, filePath))[handler]
   }

   getExec() {
      return {
         f: (event, context, done) => {
            const func = getFunction()
            process.env = _.extend(process.env, this.environment);
            return func(event, context, done)
         }
      }
   }
}

module.exports = JavascriptRuntime