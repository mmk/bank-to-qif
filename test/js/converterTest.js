/* jshint expr: true */

/*
 * Test cases for converter.js.
 */

'use strict';

var _      = require('underscore');
var should = require('should');
var fs     = require('fs');
var iconv  = require('iconv-lite');

var converter              = require('../../src/js/converter/converter');
var TransactionCategorizer = require('../../src/js/converter/transactionCategorizer');

describe('converter', function () {
    var opFileContentBuffer = fs.readFileSync(__dirname + '/../data/op-bank_account.csv');
    var opFileContent = iconv.decode(opFileContentBuffer, 'iso-8859-15');

    var nordeaFileContent = fs.readFileSync(__dirname + '/../data/nordea-bank_account.csv', { encoding: 'utf8' });

    describe('#convert()', function () {

        it('should work correctly with valid input data', function (done) {

            var inputFileContainers = [
                {
                    fileContent: opFileContent,
                    fileType: 'op',
                    ibanAccountNumber: 'FI123123123123',
                    accountName: 'Assets:Current Assets:OP account'
                },
                {
                    fileContent: nordeaFileContent,
                    fileType: 'nordea',
                    ibanAccountNumber: 'FI1234567890123456',
                    accountName: 'Assets:Current Assets:Nordea account'
                }
            ];

            var transactionCategorizer = new TransactionCategorizer();

            converter.convert(inputFileContainers, transactionCategorizer, function (outputAccounts, qifFileContent) {
                try {
                    should(outputAccounts).not.be.null;
                    outputAccounts.should.be.instanceof(Array).and.have.lengthOf(2);

                    _.times(inputFileContainers.length, function (index) {
                        var inputFileContainer = inputFileContainers[index];
                        var outputAccount = outputAccounts[index];

                        should(outputAccount).not.be.null;
                        should(outputAccount.error).be.null;
                        should(outputAccount.transactions).not.be.null;
                        should(outputAccount.accountName).be.equal(inputFileContainer.accountName);
                    });

                    should(qifFileContent).be.instanceof(String);

                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });
});
