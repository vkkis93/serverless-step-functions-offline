'use strict';
const path = require('path');
module.exports = {
    yamlParse() {
        const serverlessPath = this.serverless.config.servicePath;
        if (!serverlessPath) {
            this.cliLog('Could not find serverless.yml');
            process.exit(0);
        }
        const serverlessYmlPath = path.join(serverlessPath, 'serverless.yml');
        return this.serverless.yamlParser
            .parse(serverlessYmlPath)
            .catch(err => {
                this.cliLog('Could not parse serverless.yml');
                process.exit(0);
            });
    }

};

