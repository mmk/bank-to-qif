/*
 * This is a tool to find and handle transactions between user's own accounts.
 */

'use strict';

var _ = require('underscore');

var accountNumberTool = require('./accountNumberTool');

/*
 * Find the account on the receiving end of the given transaction.
 */
var findTargetAccount = function (originalTransaction, outputAccounts) {
    /*
     * targetAccountDescription contains the account number of the target account
     * in one of the following formats:
     *
     *   - "FI11 2222 2323 4444 55" (normal IBAN)
     *   - "FI1122222323444455" (IBAN without spaces)
     *   - "123456-78910" (traditional Finnish account number)
     */
    var targetAccountDesc = originalTransaction.targetAccountDescription;

    return _.find(outputAccounts, function (outputAccount) {
        if (targetAccountDesc.indexOf(outputAccount.ibanAccountNumber) >= 0 ||
            targetAccountDesc.indexOf(outputAccount.ibanAccountNumber.replace(/\s/g, '')) >= 0) {
            return true;
        }

        var traditional = accountNumberTool.ibanToTraditionalFinnish(outputAccount.ibanAccountNumber);
        if (traditional && targetAccountDesc.indexOf(traditional) >= 0) {
            return true;
        }

        return false;
    });
};

/*
 * Remove the transaction where the target account receives the payment.
 */
var removeReceivingTransaction = function (targetAccount, originalTransaction, selfRegExps) {

    var lastPossibleDate = new Date(originalTransaction.date.getTime() + 1000 * 60 * 60 * 24 * 7);
    var alreadyFound = false;

    targetAccount.transactions = _.reject(targetAccount.transactions, function (receivingTransaction) {
        if (alreadyFound ||
            receivingTransaction.date < originalTransaction.date ||
            receivingTransaction.date > lastPossibleDate ||
            receivingTransaction.amount !== -originalTransaction.amount) {

            return false;
        }

        var found = !!_.find(selfRegExps, function (selfRegExp) {
            return receivingTransaction.payee.match(selfRegExp);
        });

        if (found) {
            alreadyFound = true;
        }

        return found;
    });
};

/*
 * Handle transactions between user's own accounts.
 *
 * When a transfer between user's own accounts is found, it will be handled as follows:
 *
 *   - Remove the transaction on the receiving account.
 *   - Preserve the transaction on the sending account.
 *   - Set the name of the receiving account as the category of the transaction on
 *     the sending account.
 */
var handleTransactionsBetweenMyAccounts = function (outputAccounts, selfRegExps) {

    _.chain(outputAccounts)
        .filter(function (outputAccount) {
            return !outputAccount.error;
        })
        .each(function (outputAccount) {

            _.chain(outputAccount.transactions)
                .filter(function (transaction) { // Amount must be negative
                    return transaction.amount < 0;
                })
                .filter(function (transaction) { // Recipient must be self
                    return _.find(selfRegExps, function (selfRegExp) {
                        return transaction.payee.match(selfRegExp);
                    });
                })
                .each(function (transaction) {
                    var targetAccount = findTargetAccount(transaction, outputAccounts);
                    if (!targetAccount) {
                        return;
                    }

                    removeReceivingTransaction(targetAccount, transaction, selfRegExps);
                    transaction.category = targetAccount.accountName;
                });
        });
};

module.exports = {
    handleTransactionsBetweenMyAccounts: handleTransactionsBetweenMyAccounts
};
