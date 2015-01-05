/*
 * Main file for bank-to-qif conversion logic.
 */

'use strict';

var _ = require('underscore');
var Q = require('q');

var nordeaBankImporter = require('./nordeaBankImporter');
var opBankImporter     = require('./opBankImporter');
var qifExporter        = require('./qifExporter');

/**
 * QIF transaction.
 *
 * @typedef {Object} Transaction
 * @property {string} date - Date.
 * @property {string} payee - Payee / description. This will end up in the "Description" field in GnuCash.
 * @property {string} amount - Amount of money. Dot as decimal separator.
 * @property {string} category - Category / account.
 * @property {string} memo - Memo text. Will not show up in GnuCash.
 */

/**
 * InputFileContainer describes an input file to the converter.
 *
 * @typedef {Object} InputFileContainer
 * @property {string} fileContent - Content of the input file.
 * @property {string} fileType - One of 'op', 'nordea'.
 * @property {string} accountName - Name of the account in GnuCash or other software. Example: 'Assets:Current Assets:Nordea account'.
 * @property {string} ibanAccountNumber - International Bank Account Number.
 */

/**
 * OutputAccount describes the conversion result of a single bank account.
 *
 * @typedef {Object} OutputAccount
 * @property {string} accountName - Name of the account in GnuCash or other software. Example: 'Assets:Current Assets:Nordea account'.
 * @property {Transaction[]} transactions - Loaded transactions, or null if conversion failed.
 * @property {Error} error - Error object if an error occurred during conversion, null otherwise.
 */

/*
 * Import transactions from input files using the appropriate specialized importers.
 */
var importTransactions = function (inputFileContainers) {

    var outputAccounts = [];

    var promises = [];
    var mainDeferred = Q.defer();

    _.each(inputFileContainers, function (inputFileContainer) {
        var importer;
        var promise;

        var outputAccount = {
            accountName: inputFileContainer.accountName,
            transactions: null,
            error: null
        };
        outputAccounts.push(outputAccount);

        if (inputFileContainer.fileType === 'op') {
            importer = opBankImporter;
        }
        else if (inputFileContainer.fileType === 'nordea') {
            importer = nordeaBankImporter;
        }

        if (importer) {
            promise = importer.importTransactions(inputFileContainer.fileContent)
                .then(function (transactions) {
                    outputAccount.transactions = transactions;
                })
                .catch(function (error) {
                    outputAccount.error = error;
                });
        }
        else {
            outputAccount.error = new Error("Unknown input file type: '" + inputFileContainer.fileType + "'");
            promise = Q.defer().resolve().promise;
        }

        promises.push(promise);
    });

    Q.allSettled(promises).then(function () {
        mainDeferred.resolve(outputAccounts);
    });

    return mainDeferred.promise;
};

var categorizeTransactions = function (outputAccounts, transactionCategorizer) {
    _.chain(outputAccounts)
        .filter(function (outputAccount) {
            return !outputAccount.error;
        })
        .pluck('transactions')
        .flatten()
        .each(function (transaction) {
            transaction.category = transactionCategorizer.decideCategory(transaction);
        });
};

/*
 * Find transactions between user's own accounts, fix their categories and remove duplicate transactions.
 */
var handleTransactionsBetweenOwnAccounts = function (outputAccounts) {
    // TODO
};

/*
 * Generate a QIF file with all successfully loaded transactions from all accounts.
 */
var generateQifFileContent = function (outputAccounts) {
    return qifExporter.exportQif(_.filter(outputAccounts, function (outputAccount) {
        return !outputAccount.error;
    }));
};

/**
 * This callback is called when the conversion is finished.
 *
 * @callback ConversionDoneCallback
 * @param {OutputAccount[]} outputAccounts Account-specific information about conversion result.
 * @param {string} qifFileContent QIF file content.
 */

/**
 * Convert bank account data files to QIF files.
 *
 * If an error occurs during conversion of an {@link InputFileContainer}, the corresponding
 * {@link OutputAccount} will have the error property set to an Error object and
 * the transactions property set to null.
 *
 * @param {InputFileContainer[]} inputFileContainers - The input files to convert.
 * @param {ConversionDoneCallback} callback - The callback function.
 */
var convert = function (inputFileContainers, transactionCategorizer, callback) {
    importTransactions(inputFileContainers).then(function (outputAccounts) {
        var qifFileContent;

        categorizeTransactions(outputAccounts, transactionCategorizer);
        handleTransactionsBetweenOwnAccounts(outputAccounts);
        qifFileContent = generateQifFileContent(outputAccounts);

        callback(outputAccounts, qifFileContent);
    });
};

module.exports.convert = convert;
