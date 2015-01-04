/*
 * Contains logic to choose the right category (= GnuCash account) for each transaction.
 *
 * The category is chosen by matching a set of pre-defined regular expressions against
 * the payee property of the given transaction.
 */

'use strict';

var _ = require('underscore');

/*
 * NOTE: all regular expressions will be made case insensitive
 */
var exampleCategoryConfig = [
    {
        "name": "Income:Salary",
        "regexps": [
            "employer name oy"
        ]
    },
    {
        "name": "Expenses:Groceries",
        "regexps": [
            "supermarket", "s.market"
        ]
    },
    {
        "name": "Expenses:Dining",
        "regexps": [
            "restaurant", "ravintola"
        ]
    }
];

var convertRegExpStringsIntoRegExps = function (config) {
    return _.map(config, function (account) {
        return {
            name: account.name,
            regexps: _.map(account.regexps, function (regexpStr) {
                return new RegExp(regexpStr, 'i');
            })
        };
    });
};

var TransactionCategorizer = function (categoryConfig, defaultCategory) {
    this.processedCategoryConfig = convertRegExpStringsIntoRegExps(categoryConfig || exampleCategoryConfig);
    this.defaultCategory = defaultCategory || 'Expenses:Miscellaneous';
};

TransactionCategorizer.prototype.decideCategory = function (transaction) {
    var account = _.find(this.processedCategoryConfig, function (account) {
        var matchFound = _.some(account.regexps, function (regexp) {
            return transaction.payee.match(regexp);
        });

        return matchFound;
    });

    return account ? account.name : this.defaultCategory;
};

module.exports = TransactionCategorizer;
