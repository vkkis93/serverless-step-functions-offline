const BaseRuntime = require('./BaseRuntime')
const Promise = require('bluebird');
const path = require('path')
const { spawn } = require('child_process');

/**
 * Wrapper for running pyhton scripts
 */
class Pyhthon3Runtime extends BaseRuntime {
    getExec(event, context, done) {
        let parts = this.functionDefinition.handler.split('.')
        let handlerPath = parts[0]
        let handlerName = parts[1]
        this.invokeLocalPython(
            process.platform === 'win32' ? 'python.exe' : this.serverless.runtime,
            handlerPath,
            handlerName,
            event,
            context
        ).then((response) => {
            done(null, response)
        })
    }

    // Retrofitted from local invoke for python
    invokeLocalPython(runtime, handlerPath, handlerName, event, context) {
        let provider = this.serverless.getProvider('aws');
        const input = JSON.stringify({
            event: event || {},
            context: Object.assign(
                {
                    name: this.functionDefinition.name,
                    version: 'LATEST',
                    logGroupName: provider.naming.getLogGroupName(this.functionDefinition.name),
                    timeout:
                        Number(this.functionDefinition.timeout) ||
                        Number(this.serverless.service.provider.timeout) ||
                        6,
                },
                context
            ),
        });

        if (process.env.VIRTUAL_ENV) {
            const runtimeDir = os.platform() === 'win32' ? 'Scripts' : 'bin';
            process.env.PATH = [
                path.join(process.env.VIRTUAL_ENV, runtimeDir),
                path.delimiter,
                process.env.PATH,
            ].join('');
        }

        return new Promise((resolve, reject) => {
            let buffer = []
            let wrapperPath = path.join(__dirname, "/utils/runtime.py")
            const python = spawn(
                runtime.split('.')[0],
                ['-u', wrapperPath, handlerPath, handlerName],
                { env: process.env },
                { shell: true }
            );

            python.stdout.on('data', buf => {
                buffer.push(buf.toString())
                this.serverless.cli.consoleLog(buf.toString())
            });

            python.stderr.on('data', buf => this.serverless.cli.consoleLog(buf.toString()));

            python.on('close', () => {
                const responseRegex = /\[PYTHON_PROCESS_INVOKATION_RESPONSE\](.*)\[\/PYTHON_PROCESS_INVOKATION_RESPONSE\]/gm
                let bufferedOutput = buffer.join()

                let response = responseRegex.exec(bufferedOutput)
                
                if(!response){
                    return reject(new Error('Failed to parse response from python subprocess'))
                }

                try{
                    response = JSON.parse(response[1])
                } catch (e){
                    return reject(e)
                }
                console.log(response)
                resolve()
            });

            let isRejected = false;
            python.on('error', error => {
                isRejected = true;
                reject(error);
            });

            process.nextTick(() => {
                if (isRejected) return; // Runtime not available
                python.stdin.write(input);
                python.stdin.end();
            });
        });
    }
}

module.exports = Pyhthon3Runtime