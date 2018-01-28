'use strict';
const path = require('path');
module.exports = {
    yamlParse() {
        const serverlessPath = this.serverless.config.servicePath;
        if (!serverlessPath) {
            throw new this.serverless
                .classes.Error('Could not find serverless.yml');
        }
        const serverlessYmlPath = path.join(serverlessPath, 'serverless.yml');
        return this.serverless.yamlParser
            .parse(serverlessYmlPath);
    }
};

