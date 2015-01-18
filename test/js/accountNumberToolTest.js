/* jshint expr: true */

/*
 * Test cases for accountNumberTool.js.
 */

'use strict';

var _      = require('underscore');
var should = require('should');

var accountNumberTool = require('../../src/js/converter/accountNumberTool');

describe('accountNumberTool', function () {

    describe('#ibanToTraditionalFinnish()', function () {

        it('should return null when the input is invalid or unsupported', function () {
            var invalidIbans = [
                undefined, null, 1, '', 'FI12', 'FI11 2222 3333 4444 5', 'SE11 2222 3333 4444 55'
            ];

            _.each(invalidIbans, function (invalidIban) {
                var result = accountNumberTool.ibanToTraditionalFinnish(invalidIban);
                should(result).be.null;
            });
        });

        it('should correctly convert valid iban numbers', function () {
            var accounts = [
                { input: 'FI91 9999 9900 0123 45', expected: '999999-12345' },
                { input: 'FI42 8888 0000 9999 88', expected: '888800-999988' },
                { input: 'FI52 6767 1234 5678 90', expected: '676712-34567890' }
            ];

            _.each(accounts, function (account) {
                var result = accountNumberTool.ibanToTraditionalFinnish(account.input);
                should(result).not.be.null;
                result.should.be.equal(account.expected);
            });
        });
    });
});

