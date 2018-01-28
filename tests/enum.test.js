'use strict';
const expect = require('chai').expect;
const should = require('chai').should;
const sinon = require('sinon');
const enums = require('../enum');

describe('enum.js', () => {
    const supportedComparisonOperator = [
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
    ];

    const firstDate = new Date();


    describe('#supportedComparisonOperator()', () => {
        it('should have supportedComparisonOperator', () => expect(enums.supportedComparisonOperator).to.be.not.empty);

        it('should have 16 supportedComparisonOperator', () => {
            expect(enums.supportedComparisonOperator)
                .to.be.an('array')
                .to.include.members(supportedComparisonOperator);
        });
    });

    describe('#convertOperator()', () => {
        it('should have convertOperator', () => expect(enums.convertOperator).to.be.not.empty);

        describe('#BooleanEquals()', () => {
            it('should BooleanEquals return true', () => {
                const result = enums.convertOperator.BooleanEquals(true, true);
                expect(result).to.be.true;
            });

            it('should BooleanEquals return false', () => {
                const result = enums.convertOperator.BooleanEquals(true, false);
                expect(result).to.be.false;
            });
        });

        describe('#NumericEquals()', () => {
            it('should NumericEquals return true', () => {
                const result = enums.convertOperator.NumericEquals(11, 11);
                expect(result).to.be.true;
            });

            it('should NumericEquals return false', () => {
                const result = enums.convertOperator.NumericEquals(11, 0);
                expect(result).to.be.false;
            });
        });

        describe('#NumericGreaterThan()', () => {
            it('should NumericGreaterThan return true', () => {
                const result = enums.convertOperator.NumericGreaterThan(12, 11);
                expect(result).to.be.true;
            });

            it('should NumericEquals return false', () => {
                const result = enums.convertOperator.NumericGreaterThan(11, 11);
                expect(result).to.be.false;
            });
        });

        describe('#NumericGreaterThanEquals()', () => {
            it('should NumericEquals return true', () => {
                const result = enums.convertOperator.NumericGreaterThanEquals(11, 11);
                expect(result).to.be.true;
            });

            it('should NumericGreaterThanEquals return false', () => {
                const result = enums.convertOperator.NumericGreaterThanEquals(11, 12);
                expect(result).to.be.false;
            });
        });

        describe('#NumericLessThan()', () => {
            it('should NumericLessThan return true', () => {
                const result = enums.convertOperator.NumericLessThan(11, 12);
                expect(result).to.be.true;
            });

            it('should NumericLessThan return false', () => {
                const result = enums.convertOperator.NumericLessThan(11, 11);
                expect(result).to.be.false;
            });
        });

        describe('#NumericLessThan()', () => {
            it('should NumericLessThan return true', () => {
                const result = enums.convertOperator.NumericLessThan(11, 12);
                expect(result).to.be.true;
            });

            it('should NumericLessThan return false', () => {
                const result = enums.convertOperator.NumericLessThan(11, 11);
                expect(result).to.be.false;
            });
        });

        describe('#NumericLessThanEquals()', () => {
            it('should NumericLessThanEquals return true', () => {
                const result = enums.convertOperator.NumericLessThanEquals(11, 11);
                expect(result).to.be.true;
            });

            it('should NumericLessThanEquals return false', () => {
                const result = enums.convertOperator.NumericLessThanEquals(13, 12);
                expect(result).to.be.false;
            });
        });


        describe('#StringEquals()', () => {
            it('should StringEquals return true', () => {
                const result = enums.convertOperator.StringEquals('Equal', 'Equal');
                expect(result).to.be.true;
            });

            it('should StringEquals return false', () => {
                const result = enums.convertOperator.StringEquals('Equal', 'EqUal');
                expect(result).to.be.false;
            });
        });

        describe('#StringGreaterThan()', () => {
            it('should StringGreaterThan return true', () => {
                const result = enums.convertOperator.StringGreaterThan('B', 'A');
                expect(result).to.be.true;
            });

            it('should StringGreaterThan return false', () => {
                const result = enums.convertOperator.StringGreaterThan('A', 'A');
                expect(result).to.be.false;
            });
        });

        describe('#StringGreaterThanEquals()', () => {
            it('should StringGreaterThanEquals return true', () => {
                const result = enums.convertOperator.StringGreaterThanEquals('A', 'A');
                expect(result).to.be.true;
            });

            it('should StringGreaterThanEquals return false', () => {
                const result = enums.convertOperator.StringGreaterThanEquals('A', 'B');
                expect(result).to.be.false;
            });
        });

        describe('#StringLessThan()', () => {
            it('should StringLessThan return true', () => {
                const result = enums.convertOperator.StringLessThan('B', 'a');
                expect(result).to.be.true;
            });

            it('should StringLessThan return false', () => {
                const result = enums.convertOperator.StringLessThan('A', 'A');
                expect(result).to.be.false;
            });
        });


        describe('#StringLessThanEquals()', () => {
            it('should StringLessThanEquals return true', () => {
                const result = enums.convertOperator.StringLessThanEquals('A', 'A');
                expect(result).to.be.true;
            });

            it('should StringLessThanEquals return false', () => {
                const result = enums.convertOperator.StringLessThanEquals('C', 'B');
                expect(result).to.be.false;
            });
        });

        describe('#TimestampEquals()', () => {
            let secondDate = new Date();
            it('should TimestampEquals return true', () => {
                const result = enums.convertOperator.TimestampEquals(firstDate, firstDate);
                expect(result).to.be.true;
            });

            it('should TimestampEquals return false', () => {
                const result = enums.convertOperator.TimestampEquals(firstDate, secondDate);
                expect(result).to.be.false;
            });
        });


        describe('#TimestampGreaterThan()', () => {
            let secondDate = new Date();
            it('should TimestampGreaterThan return true', () => {
                const result = enums.convertOperator.TimestampGreaterThan(secondDate, firstDate);
                expect(result).to.be.true;
            });

            it('should TimestampGreaterThan return false', () => {
                const result = enums.convertOperator.TimestampGreaterThan(firstDate, secondDate);
                expect(result).to.be.false;
            });
        });

        describe('#TimestampGreaterThanEquals()', () => {
            let secondDate = new Date();
            it('should TimestampGreaterThanEquals return true', () => {
                const result = enums.convertOperator.TimestampGreaterThanEquals(secondDate, secondDate);
                expect(result).to.be.true;
            });

            it('should TimestampGreaterThanEquals return false', () => {
                const result = enums.convertOperator.TimestampGreaterThanEquals(firstDate, secondDate);
                expect(result).to.be.false;
            });
        });

        describe('#TimestampGreaterThan()', () => {
            let secondDate = new Date();
            it('should TimestampGreaterThan return true', () => {
                const result = enums.convertOperator.TimestampLessThan(firstDate, secondDate);
                expect(result).to.be.true;
            });

            it('should TimestampGreaterThan return false', () => {
                const result = enums.convertOperator.TimestampLessThan(secondDate, firstDate);
                expect(result).to.be.false;
            });
        });

        describe('#TimestampLessThanEquals()', () => {
            let secondDate = new Date();
            it('should TimestampLessThanEquals return true', () => {
                const result = enums.convertOperator.TimestampLessThanEquals(secondDate, secondDate);
                expect(result).to.be.true;
            });

            it('should TimestampGreaterThan return false', () => {
                const result = enums.convertOperator.TimestampLessThanEquals(secondDate, firstDate);
                expect(result).to.be.false;
            });
        });



    });
});