/*
 * Export transactions in QIF format. See [1] for format specification.
 *
 * [1] https://github.com/Gnucash/gnucash/blob/master/src/import-export/qif-imp/file-format.txt
 */

'use strict';

var _ = require('underscore');

var generateQifHeader = function (bankAccountName) {
    var header = "!Account\n" +
                 "N" + bankAccountName + "\n" +
                 "TBank\n" +
                 "^\n" +
                 "!Type:Bank\n";
    return header;
};

var generateQifTransaction = function (transaction) {
    var output = "";

    output += 'D' + transaction.date + "\n";
    output += 'P' + transaction.payee + "\n";
    output += 'T' + transaction.amount + "\n";
    output += 'L[' + transaction.category + "]\n";

    if (transaction.memo) {
        output += 'M' + transaction.memo + "\n";
    }

    output += "^\n";

    return output;
};

var exportQif = function (bankAccountName, transactions) {

    var output = generateQifHeader(bankAccountName);

    _.each(transactions, function (transaction) {
        output += generateQifTransaction(transaction);
    });

    return output;
};

module.exports.exportQif = exportQif;
