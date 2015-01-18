/* jshint expr: true */

/*
 * Test cases for both importerHelper.js.
 */

'use strict';

var _      = require('underscore');
var should = require('should');

var importerHelper = require('../../src/js/converter/importerHelper');

describe('importerHelper', function () {

    describe('#parseDate()', function () {
        it('should return null when the input is invalid', function () {
            var inputStrings = [
                null, undefined, '', 'a', '12.12', '12.12.', '1.12.2015.'
            ];

            _.each(inputStrings, function (inputString) {
                var result = importerHelper.parseDate(inputString);
                should(result).be.null;
            });
        });

        it('should return a valid date when the input is valid', function () {
            var inputs = [
                { inputStr: '1.2.2015',  expected: new Date(2015, 1, 1) },
                { inputStr: '2.1.2015',  expected: new Date(2015, 0, 2) },
                { inputStr: '1.12.2020', expected: new Date(2020, 11, 1) },
                { inputStr: '20.5.2000', expected: new Date(2000, 4, 20) }
            ];
            _.each(inputs, function (input) {
                var result = importerHelper.parseDate(input.inputStr);
                should(result).be.ok;
                (result.getTime()).should.be.equal(input.expected.getTime());
            });
        });
    });

    describe('#dateToString()', function () {
        it('should return null when the input invalid', function () {
            var inputDates = [
                null, undefined, '', 1
            ];
            _.each(inputDates, function (inputDate) {
                var result = importerHelper.dateToString(inputDate);
                should(result).be.null;
            });
        });

        it('should return a valid date string when the input is valid', function () {
            var inputs = [
                { inputDate: new Date(2015, 1, 1),  expected: '01/02/2015' },
                { inputDate: new Date(2015, 0, 2),  expected: '02/01/2015' },
                { inputDate: new Date(2020, 11, 1), expected: '01/12/2020' },
                { inputDate: new Date(2000, 4, 20), expected: '20/05/2000' }
            ];
            _.each(inputs, function (input) {
                var result = importerHelper.dateToString(input.inputDate);
                should(result).be.ok;
                result.should.be.equal(input.expected);
            });
        });
    });

    describe('#parseAmount()', function () {
        it('should return null when the input invalid', function () {
            var inputAmounts = [
                null, undefined, '', 1, '--1.1', '+1', '3.2.3', '1a', '1.0a'
            ];
            _.each(inputAmounts, function (inputAmount) {
                var result = importerHelper.parseAmount(inputAmount);
                should(result).be.null;
            });
        });

        it('should return a valid number when the input is valid', function () {
            var inputs = [
                { inputAmount: '1',         expected: 1 },
                { inputAmount: '1,15',      expected: 1.15 },
                { inputAmount: '0,500',     expected: 0.5 },
                { inputAmount: '-83,45',    expected: -83.45 },
                { inputAmount: '153',       expected: 153 },
                { inputAmount: '1 500,14',  expected: 1500.14 },
                { inputAmount: '2 003 004', expected: 2003004 }
            ];
            _.each(inputs, function (input) {
                var result = importerHelper.parseAmount(input.inputAmount);
                should(result).be.ok;
                result.should.be.equal(input.expected);
            });
        });
    });
});

