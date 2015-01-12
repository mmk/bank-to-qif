/*
 * Main file for bank-to-qif user interface code.
 * 
 * Entry point to the actual conversion logic can be found in converter/converter.js.
 */

'use strict';

var $        = window.$ = window.jQuery = require('jquery'); // Make global for bootstrap
var _        = require('underscore');
var Q        = require('q');
var mustache = require('mustache');

var converter              = require('./converter/converter');
var TransactionCategorizer = require('./converter/transactionCategorizer');
var accountConfig          = require('./accountConfig');

var transactionCategorizer = new TransactionCategorizer();

var selectedFileTemplate = $('#selectedFileTemplate').html();
mustache.parse(selectedFileTemplate);

var qifFilename = 'result.qif';
var selectedFiles = [];

var $chooseAccountInstruction = $('.chooseAccountInstruction');
var $downloadLink = $('.downloadQif');

var baseSelectedFile = {
    filename: null,
    file: null,
    fileContent: null,
    account: null,
    status: 'default',
    error: null,

    _renderAccountChooser: function () {
        var $select = $('<select></select>');
        $select.append('<option value="-1">Choose bank account</option>');

        _.each(accountConfig, function (accountConfigItem) {
            var $option = $('<option></option>');
            $option.append(accountConfigItem.accountName);
            $select.append($option);
        });

        return $select;
    },

    setStatus: function (status, error) {
        this.status = status;
        this.error = error || null;
    },

    update: function () {
        if (!this.account) {
            this.setStatus('default');
        }

        var $panel = this.$el.find('.panel');
        $panel.removeClass('panel-default panel-success panel-danger');
        $panel.addClass('panel-' + this.status);
    },

    render: function () {
        this.$el = $(mustache.render(selectedFileTemplate, {
            filename: this.filename,
            status: this.status
        }));

        this.$el.find('a[data-class=removeFile]').on('click', function () {
            // TODO
        });

        var $accountChooser = this._renderAccountChooser();
        this.$el.find('.accountChooser').append($accountChooser);

        $accountChooser.on('change', _.bind(function () {
            var selectedIndex = $accountChooser[0].selectedIndex;
            this.account = (selectedIndex === 0 ? null : accountConfig[selectedIndex - 1]);
            this.update();
            doConversion();
        }, this));

        return this.$el;
    }
};

var updateSelectedFiles = function () {
    var invalidOrMissing = false;

    _.each(selectedFiles, function (selectedFile) {
        selectedFile.update();

        if (selectedFile.error || !selectedFile.account) {
            invalidOrMissing = true;
        }
    });

    if (selectedFiles.length > 0) {
        $downloadLink.toggle(!invalidOrMissing);
        $chooseAccountInstruction.toggle(invalidOrMissing);
    }
    else {
        $downloadLink.hide();
        $chooseAccountInstruction.hide();
    }
};

var convertInputFileContainers = function (inputFileContainers) {
    converter.convert(inputFileContainers, transactionCategorizer, function (outputAccounts, qifFileContent) {
        _.each(selectedFiles, function (selectedFile) {
            var errorFound = false;

            if (selectedFile.fileContent && selectedFile.account) {
                _.each(outputAccounts, function (outputAccount) {
                    if (outputAccount.accountName === selectedFile.account.accountName && outputAccount.error) {
                        selectedFile.setStatus('danger', outputAccount.error);
                        errorFound = true;
                    }
                });

                if (!errorFound) {
                    selectedFile.setStatus('success');
                }
            }
        });

        $downloadLink.attr({
            'href': 'data:text/plain;charset=utf-8,' + encodeURIComponent(qifFileContent),
            'download': qifFilename
        });

        updateSelectedFiles();
    });
};

var createInputFileContainers = function () {
    return _.chain(selectedFiles)
        .filter(function (selectedFile) {
            return selectedFile.fileContent && selectedFile.account;
        })
        .map(function (selectedFile) {
            return _.chain(selectedFile.account)
                .pick('fileType', 'ibanAccountNumber', 'accountName')
                .extend({
                    fileContent: selectedFile.fileContent,
                    selectedFile: selectedFile
                })
                .value();
        })
        .value();
};

var doConversion = function () {
    loadContentFromInputFiles().then(function () {
        var inputFileContainers = createInputFileContainers();
        updateSelectedFiles(inputFileContainers);

        _.defer(function () {
            convertInputFileContainers(inputFileContainers);
        });
    });
};

var loadContentFromInputFiles = function () {
    var promises = [];
    var mainDeferred = Q.defer();

    _.each(selectedFiles, function (selectedFile) {
        if (!selectedFile.file || !selectedFile.account) {
            selectedFile.fileContent = null;
            selectedFile.setStatus('default');
            return;
        }

        var reader = new FileReader();
        var deferred = Q.defer();

        reader.onload = function () {
            selectedFile.fileContent = reader.result;
            deferred.resolve();
        };
        reader.onerror = function () {
            selectedFile.fileContent = null;
            selectedFile.setStatus('danger', new Error('Cannot read input file'));
            deferred.reject();
        };

        reader.readAsText(selectedFile.file, selectedFile.account.inputEncoding);
        promises.push(deferred.promise);
    });

    Q.allSettled(promises).then(function () {
        mainDeferred.resolve();
    });

    return mainDeferred.promise;
};

var setupFileInput = function () {
    var $fileInput = $('#fileChooser input[type=file]');

    $fileInput.on('change', function () {
        _.each($fileInput[0].files, function (file) {
            var selectedFile = Object.create(baseSelectedFile);
            selectedFile.file = file;
            selectedFile.filename = file.name;

            $('#selectedFiles').append(selectedFile.render());
            selectedFiles.push(selectedFile);
        });

        updateSelectedFiles();
    });
};

$(function () {
    setupFileInput();
});
