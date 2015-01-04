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
 * InputFileContainer describes an input file to the converter.
 *
 * @typedef {Object} InputFileContainer
 * @property {string} fileContent - Content of the input file.
 * @property {string} fileType - One of 'op', 'nordea'.
 * @property {string} accountName - Name of the account in GnuCash or other software. Example: 'Assets:Current Assets:Nordea account'.
 * @property {string} ibanAccountNumber - International Bank Account Number.
 */

/**
 * OutputFileContainer describes an output file from the converter.
 *
 * @typedef {Object} OutputFileContainer
 * @property {string} qifFileContent - Content of the output QIF file, or null if the conversion failed.
 * @property {string} fileType - One of 'op', 'nordea'.
 * @property {string} accountName - Name of the account in GnuCash or other software. Example: 'Assets:Current Assets:Nordea account'.
 * @property {string} ibanAccountNumber - International Bank Account Number.
 * @property {Error} error - Error object if an error occurred during conversion, null otherwise.
 */

/*
 * Import transactions from input files using the appropriate specialized importers.
 */
var importTransactions = function (inputFileContainers) {

    var outputFileContainers = [];

    var promises = [];
    var mainDeferred = Q.defer();

    _.each(inputFileContainers, function (inputFileContainer) {
        var importer;
        var promise;

        var outputFileContainer = _.pick(inputFileContainer, 'fileType', 'accountName', 'ibanAccountNumber');
        outputFileContainer.transactions = null;
        outputFileContainer.error = null;
        outputFileContainers.push(outputFileContainer);

        if (inputFileContainer.fileType === 'op') {
            importer = opBankImporter;
        }
        else if (inputFileContainer.fileType === 'nordea') {
            importer = nordeaBankImporter;
        }

        if (importer) {
            promise = importer.importTransactions(inputFileContainer.fileContent)
                .then(function (transactions) {
                    outputFileContainer.transactions = transactions;
                })
                .catch(function (error) {
                    outputFileContainer.error = error;
                });
        }
        else {
            outputFileContainer.error = new Error("Unknown input file type: '" + inputFileContainer.fileType + "'");
            promise = Q.defer().resolve().promise;
        }

        promises.push(promise);
    });

    Q.allSettled(promises).then(function () {
        mainDeferred.resolve(outputFileContainers);
    });

    return mainDeferred.promise;
};

var categorizeTransactions = function (outputFileContainers, transactionCategorizer) {
    _.each(outputFileContainers, function (outputFileContainer) {
        if (outputFileContainer.error) {
            return;
        }

        _.each(outputFileContainer.transactions, function (transaction) {
            transaction.category = transactionCategorizer.decideCategory(transaction);
        });
    });
};

/*
 * Find transactions between user's own accounts, fix their categories and remove duplicate transactions.
 */
var handleTransactionsBetweenOwnAccounts = function (outputFileContainers) {
    // TODO
};

/*
 * Generate QIF file content from transactions.
 */
var generateQifFileContent = function (outputFileContainers) {
    _.each(outputFileContainers, function (outputFileContainer) {
        if (outputFileContainer.error) {
            return;
        }

        outputFileContainer.qifFileContent =
            qifExporter.exportQif(outputFileContainer.accountName, outputFileContainer.transactions);
    });
};

/**
 * This callback is called when the conversion is finished.
 *
 * @callback ConversionDoneCallback
 * @param {OutputFileContainer[]} outputFileContainers Containers with the QIF file content and metadata.
 */

/**
 * Convert bank account data files to QIF files.
 *
 * If an error occurs during conversion of an {@link InputFileContainer}, the corresponding
 * {@link OutputFileContainer} will have the error property set to an Error object and
 * the qifFileContent property set to null.
 *
 * @param {InputFileContainer[]} inputFileContainers - The input files to convert.
 * @param {ConversionDoneCallback} callback - The callback function which will be called with a {InputFileContainer[]} inputFileContainers - The input files to convert.
 */
var convert = function (inputFileContainers, transactionCategorizer, callback) {
    importTransactions(inputFileContainers).then(function (outputFileContainers) {
        categorizeTransactions(outputFileContainers, transactionCategorizer);
        handleTransactionsBetweenOwnAccounts(outputFileContainers);
        generateQifFileContent(outputFileContainers);

        callback(outputFileContainers);
    });
};

module.exports.convert = convert;
