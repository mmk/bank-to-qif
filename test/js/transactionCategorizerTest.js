/* jshint expr: true */

/*
 * Test cases for transactionCategorizer.js.
 */

'use strict';

var _      = require('underscore');
var should = require('should');

var TransactionCategorizer = require('../../src/js/converter/transactionCategorizer');

describe('TransactionCategorizer', function () {

    var transactions = [
        {
            date: '04/08/2014',
            payee: 'Some restaurant',
            amount: '-10',
            category: null,
            memo: 'Something'
        },
        {
            date: '05/04/2014',
            payee: 'XYZ SUPERMARKET 12345',
            amount: '-25.5',
            category: null,
            memo: 'Misc'
        },
        {
            date: '05/04/2014',
            payee: 'Unknown',
            amount: '-15.0',
            category: null,
            memo: 'Misc'
        },
        {
            date: '15/09/2014',
            payee: 'Employer Name OY',
            amount: '1234',
            category: null,
            memo: ''
        }
    ];

    var expectedCategories = [
        'Expenses:Dining',
        'Expenses:Groceries',
        'Expenses:Miscellaneous',
        'Income:Salary'
    ];

    var transactionCategorizer = new TransactionCategorizer();

    describe('#getCategoryForTransaction()', function () {
        it('should return correct category for each transaction', function () {
            _.each(transactions, function (transaction, index) {
                var category = transactionCategorizer.decideCategory(transaction);
                category.should.be.equal(expectedCategories[index]);
            });
        });
    });
});
