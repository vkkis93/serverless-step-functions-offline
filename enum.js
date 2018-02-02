'use strict';
const _ = require('lodash');
module.exports = {
    // comparisonOperators: [
    //     'And',
    //     'BooleanEquals',
    //     'Not',
    //     'NumericEquals',
    //     'NumericGreaterThan',
    //     'NumericGreaterThanEquals',
    //     'NumericLessThan',
    //     'NumericLessThanEquals',
    //     'Or',
    //     'StringEquals',
    //     'StringGreaterThan',
    //     'StringGreaterThanEquals',
    //     'StringLessThan',
    //     'StringLessThanEquals',
    //     'TimestampEquals',
    //     'TimestampGreaterThan',
    //     'TimestampGreaterThanEquals',
    //     'TimestampLessThan',
    //     'TimestampLessThanEquals'
    // ],

    supportedComparisonOperator: [
        'BooleanEquals',
        'NumericEquals',
        'NumericGreaterThan',
        'NumericGreaterThanEquals',
        'NumericLessThan',
        'NumericLessThanEquals',
        'StringEquals',
        'StringGreaterThan',
        'StringGreaterThanEquals',
        'StringLessThan',
        'StringLessThanEquals',
        'TimestampEquals',
        'TimestampGreaterThan',
        'TimestampGreaterThanEquals',
        'TimestampLessThan',
        'TimestampLessThanEquals'
    ],

    convertOperator: {
        'BooleanEquals': (value, other) => _.eq(value, other),
        'NumericEquals': (value, other) => _.eq(value, other),
        'NumericGreaterThan': (value, other) => _.gt(value, other),
        'NumericGreaterThanEquals': (value, other) => _.gte(value, other),
        'NumericLessThan': (value, other) => _.lt(value, other),
        'NumericLessThanEquals': (value, other) => _.lte(value, other),
        'StringEquals': (value, other) => _.eq(value, other),
        'StringGreaterThan': (value, other) => _.gt(value, other),
        'StringGreaterThanEquals': (value, other) => _.gte(value, other),
        'StringLessThan': (value, other) => _.lt(value, other),
        'StringLessThanEquals': (value, other) => _.lte(value, other),
        'TimestampEquals': (value, other) => _.eq(value, other),
        'TimestampGreaterThan': (value, other) => _.gt(value, other),
        'TimestampGreaterThanEquals': (value, other) => _.gte(value, other),
        'TimestampLessThan': (value, other) => _.lt(value, other),
        'TimestampLessThanEquals': (value, other) => _.lte(value, other)
    }
};
