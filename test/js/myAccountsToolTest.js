/* jshint expr: true */

/*
 * Test cases for myAccountsTool.js.
 */

'use strict';

var _      = require('underscore');
var should = require('should');

var myAccountsTool = require('../../src/js/converter/myAccountsTool');

/*
 * Initialize test data.
 */
var initOutputAccounts = function () {

    var outputAccount1 = {
        accountName: 'Account 1',
        ibanAccountNumber: 'FI91 9999 9900 0123 45',
        error: null,
        transactions: [
            {
                /* Sent to account 2 */
                date: new Date(2014, 7, 4),
                dateStr: '04/08/2014',
                payee: 'John Smith',
                amount: -10,
                amountStr: '-10',
                category: null,
                targetAccountDescription: 'FI11 2222 2323 4444 55 / OKOYFIHH',
                memo: ''
            },
            {
                /* Received from account 3 */
                date: new Date(2014, 8, 13),
                dateStr: '13/09/2014',
                payee: 'John Smith',
                amount: 101,
                amountStr: '101',
                category: null,
                targetAccountDescription: '',
                memo: ''
            },
            {
                /* Sent to account 3 */
                date: new Date(2014, 8, 14),
                dateStr: '14/09/2014',
                payee: 'SMITH JOHN',
                amount: -101.5,
                amountStr: '-101.50',
                category: null,
                targetAccountDescription: 'FI2233334444555566',
                memo: ''
            }
        ]
    };

    var outputAccount2 = {
        accountName: 'Account 2',
        ibanAccountNumber: 'FI11 2222 2323 4444 55',
        error: null,
        transactions: [
            {
                /* Received from someone else */
                date: new Date(2014, 7, 5),
                dateStr: '05/08/2014',
                payee: 'John Doe',
                amount: 10,
                amountStr: '10',
                category: null,
                targetAccountDescription: '',
                memo: ''
            },
            {
                /*
                 * Received from John Smith's unknown account.
                 * This must be left untouched.
                 */
                date: new Date(2014, 7, 6),
                dateStr: '06/08/2014',
                payee: 'John Smith',
                amount: 50,
                amountStr: '50',
                category: null,
                targetAccountDescription: '',
                memo: ''
            },
            {
                /* Received from account 1 */
                date: new Date(2014, 7, 7),
                dateStr: '07/08/2014',
                payee: 'John Smith',
                amount: 10,
                amountStr: '10',
                category: null,
                targetAccountDescription: '',
                memo: ''
            }
        ]
    };

    var outputAccount3 = {
        accountName: 'Account 3',
        ibanAccountNumber: 'FI22 3333 4444 5555 66',
        error: null,
        transactions: [
            {
                /* Sent to account 1 */
                date: new Date(2014, 8, 13),
                dateStr: '13/09/2014',
                payee: 'John Smith',
                amount: -101,
                amountStr: '-101',
                category: null,
                targetAccountDescription: '999999-12345',
                memo: ''
            },
            {
                /* Received from account 1 */
                date: new Date(2014, 8, 18),
                dateStr: '18/09/2014',
                payee: 'SMITH JOHN',
                amount: 101.5,
                amountStr: '101.50',
                category: null,
                targetAccountDescription: '',
                memo: ''
            }
        ]
    };

    return [ outputAccount1, outputAccount2, outputAccount3 ];
};

var selfRegExps = [ /john smith/i, /smith john/i ];

describe('myAccountsTool', function () {

    describe('#handleTransactionsBetweenMyAccounts()', function () {

        it('should leave transactions untouched when receiving transactions are not found', function () {

            var outputAccounts = initOutputAccounts().slice(1);

            myAccountsTool.handleTransactionsBetweenMyAccounts(outputAccounts, selfRegExps);
            outputAccounts.should.be.instanceof(Array).and.have.lengthOf(2);

            var outputAccount2 = outputAccounts[0];
            var outputAccount3 = outputAccounts[1];

            (outputAccount2.transactions).should.be.instanceof(Array).and.have.lengthOf(3);
            (outputAccount3.transactions).should.be.instanceof(Array).and.have.lengthOf(2);

            var allTransactions = outputAccount2.transactions.concat(outputAccount3.transactions);
            _.each(allTransactions, function (transaction) {
                should(transaction.category).be.null;
            });

        });

        it('should correctly recognize and categorize transfers between own accounts ' +
            'and remove receiving (duplicate) transactions', function () {

            var outputAccounts = initOutputAccounts();

            myAccountsTool.handleTransactionsBetweenMyAccounts(outputAccounts, selfRegExps);

            outputAccounts.should.be.instanceof(Array).and.have.lengthOf(3);

            _.each(outputAccounts, function (outputAccount) {
                should(outputAccount).be.ok;
                should(outputAccount.error).be.null;
            });

            var outputAccount1 = outputAccounts[0];
            var outputAccount2 = outputAccounts[1];
            var outputAccount3 = outputAccounts[2];

            (outputAccount1.transactions).should.be.instanceof(Array).and.have.lengthOf(2);
            (outputAccount2.transactions).should.be.instanceof(Array).and.have.lengthOf(2);
            (outputAccount3.transactions).should.be.instanceof(Array).and.have.lengthOf(1);

            should(outputAccount1.transactions[0].category).be.equal('Account 2');
            should(outputAccount1.transactions[1].category).be.equal('Account 3');

            should(outputAccount2.transactions[0].dateStr).be.equal('05/08/2014');
            should(outputAccount2.transactions[1].dateStr).be.equal('06/08/2014');

            should(outputAccount3.transactions[0].category).be.equal('Account 1');
        });

    });
});
