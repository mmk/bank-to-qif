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

var validateTransaction = function (transaction, expectedAmount, expectedCategory, expectedPayee) {
    should(transaction).be.ok;
    (transaction.amount).should.be.equal(expectedAmount);
    (transaction.category).should.be.equal(expectedCategory);
    (transaction.payee).should.be.equal(expectedPayee);
};

var findTransactionWithDate = function (outputAccount, date) {
    return _.find(outputAccount.transactions, function (t) {
        return t.dateStr === date;
    });
};

describe('converter', function () {
    var op1FileContentBuffer = fs.readFileSync(__dirname + '/../data/op-bank_account1.csv');
    var op1FileContent = iconv.decode(op1FileContentBuffer, 'iso-8859-15');

    var op2FileContentBuffer = fs.readFileSync(__dirname + '/../data/op-bank_account2.csv');
    var op2FileContent = iconv.decode(op2FileContentBuffer, 'iso-8859-15');

    var nordea1FileContent = fs.readFileSync(__dirname + '/../data/nordea-bank_account1.csv', { encoding: 'utf8' });
    var nordea2FileContent = fs.readFileSync(__dirname + '/../data/nordea-bank_account2.csv', { encoding: 'utf8' });

    describe('#convert()', function () {

        it('should work correctly with valid input data', function (done) {

            var op1AccountName = 'Assets:Current Assets:First OP account';
            var op2AccountName = 'Assets:Current Assets:Second OP account';
            var nordea1AccountName = 'Assets:Current Assets:First Nordea account';
            var nordea2AccountName = 'Assets:Current Assets:Second Nordea account';
            var inputFileContainers = [
                {
                    fileContent: op1FileContent,
                    fileType: 'op',
                    ibanAccountNumber: 'FI11 2222 2323 4444 55',
                    accountName: op1AccountName
                },
                {
                    fileContent: op2FileContent,
                    fileType: 'op',
                    ibanAccountNumber: 'FI22 3333 4444 5555 66',
                    accountName: op2AccountName
                },
                {
                    fileContent: nordea1FileContent,
                    fileType: 'nordea',
                    ibanAccountNumber: 'FI99 8888 7777 6666 55',
                    accountName: nordea1AccountName
                },
                {
                    fileContent: nordea2FileContent,
                    fileType: 'nordea',
                    ibanAccountNumber: 'FI88 7777 6666 5555 44',
                    accountName: nordea2AccountName
                }
            ];

            var categorizer = new TransactionCategorizer();
            var selfRegExps = [ /john smith/i, /smith john/i ];

            converter.convert(inputFileContainers, categorizer, selfRegExps, function (outputAccounts, qifFileContent) {
                try {
                    should(outputAccounts).not.be.null;
                    outputAccounts.should.be.instanceof(Array).and.have.lengthOf(4);

                    _.times(inputFileContainers.length, function (index) {
                        var inputFileContainer = inputFileContainers[index];
                        var outputAccount = outputAccounts[index];

                        should(outputAccount).not.be.null;
                        should(outputAccount.error).be.null;
                        should(outputAccount.transactions).not.be.null;
                        should(outputAccount.accountName).be.equal(inputFileContainer.accountName);
                    });

                    var op1OutputAccount = outputAccounts[0];
                    var op2OutputAccount = outputAccounts[1];
                    var nordea1OutputAccount = outputAccounts[2];
                    var nordea2OutputAccount = outputAccounts[3];

                    // One receiving transaction removed from OP1
                    (op1OutputAccount.transactions).should.be.instanceof(Array).and.have.lengthOf(8);

                    // One receiving transaction removed from OP2
                    (op2OutputAccount.transactions).should.be.instanceof(Array).and.have.lengthOf(2);

                    // Two receiving transactions removed from Nordea1
                    (nordea1OutputAccount.transactions).should.be.instanceof(Array).and.have.lengthOf(5);

                    (nordea2OutputAccount.transactions).should.be.instanceof(Array).and.have.lengthOf(1);

                    /*
                     * Check that all transfers between user's own accounts are ok.
                     */

                    var op1ToNordea1Transaction = findTransactionWithDate(op1OutputAccount, '01/04/2014');
                    validateTransaction(op1ToNordea1Transaction, -59.5, nordea1AccountName, 'John Smith');

                    var op1ToOp2Transaction = findTransactionWithDate(op1OutputAccount, '04/07/2014');
                    validateTransaction(op1ToOp2Transaction, -450, op2AccountName, 'John Smith');

                    var nordea1ToOp1Transaction = findTransactionWithDate(nordea1OutputAccount, '01/02/2014');
                    validateTransaction(nordea1ToOp1Transaction, -33.44, op1AccountName, 'John Smith');

                    var nordea2ToNordea1Transaction = findTransactionWithDate(nordea2OutputAccount, '10/03/2014');
                    validateTransaction(nordea2ToNordea1Transaction, -16.09, nordea1AccountName, 'SMITH JOHN');

                    /*
                     * Check that other categorization has been done.
                     */

                    var supermarketTransaction = findTransactionWithDate(op1OutputAccount, '02/06/2014');
                    validateTransaction(supermarketTransaction, -8.42, 'Expenses:Groceries', 'Random Supermarket XYZ');

                    var restaurantTransaction = findTransactionWithDate(nordea1OutputAccount, '07/02/2014');
                    validateTransaction(restaurantTransaction, -16.12, 'Expenses:Dining', 'Restaurant XYZ');

                    /*
                     * Check QIF content.
                     */

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
