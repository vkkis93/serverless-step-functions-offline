const BaseRuntime = require('./BaseRuntime')
const childProcess = require('child_process')
const shellEscape = require('shell-escape');
const path = require('path')

/**
 * Wrapper for running pyhton scripts
 */
class Pyhthon3Runtime extends BaseRuntime {
    getExec(){
        return {
            f: (event, context, done) => {
                // Fork python process to execute 
                //throw new Error("Lol")
                let args = [
                    'python',
                    path.join(__dirname, '/utils/runtime.py'),
                    `--location=${Buffer.from(this.location).toString('base64')}`,
                    `--handler=${Buffer.from(this.handlerPath).toString('base64')}`,
                    `--environment=${Buffer.from(JSON.stringify(this.environment || {})).toString('base64')}`,
                    `--event=${Buffer.from(JSON.stringify(event || {})).toString('base64')}`,
                    `--context=${Buffer.from(JSON.stringify(context || {})).toString('base64')}`
                ]

                console.log(args)
                results = childProcess.execSync( args.join(" ") )
                console.log(results)
                throw Error()
                return func(event, context, done)
            }
        }
    }
}

module.exports = Pyhthon3Runtime