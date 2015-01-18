/*
 * Export transactions in QIF format. See [1] for format specification.
 *
 * [1] https://github.com/Gnucash/gnucash/blob/master/src/import-export/qif-imp/file-format.txt
 */

'use strict';

var _ = require('underscore');

var generateQifAccountList = function (outputAccounts) {
    var output = "!Option:AutoSwitch\n" +
                 "!Account\n";

    _.each(outputAccounts, function (outputAccount) {
        output += "N" + outputAccount.accountName + "\n";
        output += "TBank\n";
        output += "^\n";
    });

    output += "!Clear:AutoSwitch\n";

    return output;
};

var generateQifTransaction = function (transaction) {
    var output = "";

    output += 'D' + transaction.dateStr + "\n";
    output += 'P' + transaction.payee + "\n";
    output += 'T' + transaction.amountStr + "\n";

    if (transaction.category) {
        output += 'L[' + transaction.category + "]\n";
    }

    if (transaction.memo) {
        output += 'M' + transaction.memo + "\n";
    }

    output += "^\n";

    return output;
};

var generateQifTransactionsForAccount = function (outputAccount) {
    var output = "!Account\n" +
                 "N" + outputAccount.accountName + "\n" +
                 "^\n" +
                 "!Type:Bank\n";

    _.each(outputAccount.transactions, function (transaction) {
        output += generateQifTransaction(transaction);
    });

    return output;
};

var exportQif = function (outputAccounts) {
    var output = generateQifAccountList(outputAccounts);

    _.each(outputAccounts, function (outputAccount) {
        output += generateQifTransactionsForAccount(outputAccount);
    });

    return output;
};

module.exports.exportQif = exportQif;
