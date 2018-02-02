'use strict';
const Promise = require('bluebird');
console.log('Loading function One');

exports.handler = (event, context, callback) => {
    console.log('First lambda', event);
    return Promise.resolve()
        .then(() => {
            return context.succeed({foo: 1, expirydate: '2015-09-04T01:59:00Z', expiryseconds: 22});
        });
};

