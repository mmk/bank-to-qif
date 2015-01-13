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

/**
 * SelectedFile describes an input file chosen by the user.
 *
 * @typedef {Object} SelectedFile
 * @property {string} file - File object from the file input element.
 * @property {string} fileName - Filename of the input file.
 * @property {string} fileContent - Content of the input file.
 * @property {string} account - Account configuration.
 */

var downloadArea = {

    qifFilename: 'result.qif',

    $chooseAccountInstruction: $('.chooseAccountInstruction'),
    $downloadLink: $('.downloadQif'),

    hide: function () {
        this.$downloadLink.hide();
        this.$chooseAccountInstruction.hide();
    },

    displayInstructions: function () {
        this.$downloadLink.hide();
        this.$chooseAccountInstruction.show();
    },

    displayDownloadLink: function () {
        this.$chooseAccountInstruction.hide();
        this.$downloadLink.show();
    },

    setQifFileContent: function (qifFileContent) {
        this.$downloadLink.attr({
            'href': 'data:text/plain;charset=utf-8,' + encodeURIComponent(qifFileContent),
            'download': this.qifFilename
        });
    }

};

var selectedFilesContainer = {
    $el: $('#selectedFilesContainer'),
    selectedFiles: [],

    updateView: function () {
        var invalidOrMissing = false;

        _.each(this.selectedFiles, function (selectedFile) {
            selectedFile.update();

            if (selectedFile.error || !selectedFile.account) {
                invalidOrMissing = true;
            }
        });

        if (this.selectedFiles.length === 0) {
            downloadArea.hide();
        }
        else if (invalidOrMissing) {
            downloadArea.displayInstructions();
        }
        else {
            downloadArea.displayDownloadLink();
        }
    },

    addSelectedFile: function (selectedFile) {
        var $selectedFileEl = selectedFile.render();
        this.$el.append($selectedFileEl);

        this.selectedFiles.push(selectedFile);

        $selectedFileEl.find('a[data-class=removeFile]').on('click', function () {
            // TODO
        });
    }
};

var baseSelectedFile = {
    filename: null,
    file: null,
    fileContent: null,
    account: null,
    status: 'default',
    error: null,
    template: null,

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
        var $panel = this.$el.find('.panel');
        var $errorRow = this.$el.find('.errorRow');
        var $error = this.$el.find('.error');

        if (!this.account) {
            this.setStatus('default');
        }

        $panel.removeClass('panel-default panel-success panel-danger');
        $panel.addClass('panel-' + this.status);

        if (this.error) {
            $errorRow.removeClass('hidden');
            $error.text(this.error.message || 'Error');
        }
        else {
            $errorRow.addClass('hidden');
        }
    },

    _onChangeAccount: function (accountChooser) {
        var selectedIndex = accountChooser.selectedIndex;
        this.account = (selectedIndex === 0 ? null : accountConfig[selectedIndex - 1]);
        this.update();

        tryToConvertSelectedFiles();
    },

    render: function () {
        this.$el = $(mustache.render(this.template, {
            filename: this.filename,
            status: this.status
        }));

        var $accountChooser = this._renderAccountChooser();
        this.$el.find('.accountChooser').append($accountChooser);

        $accountChooser.on('change', _.bind(function () {
            this._onChangeAccount($accountChooser[0]);
        }, this));

        return this.$el;
    }
};

var handleConversionResults = function (outputAccounts, qifFileContent) {

    _.chain(selectedFilesContainer.selectedFiles)
        .filter(function (selectedFile) {
            return selectedFile.fileContent && selectedFile.account;
        })
        .each(function (selectedFile) {
            var errorFound = false;

            _.each(outputAccounts, function (outputAccount) {
                if (outputAccount.accountName === selectedFile.account.accountName && outputAccount.error) {
                    selectedFile.setStatus('danger', outputAccount.error);
                    errorFound = true;
                }
            });

            if (!errorFound) {
                selectedFile.setStatus('success');
            }
        });

    downloadArea.setQifFileContent(qifFileContent);

    selectedFilesContainer.updateView();
};

var tryToConvertSelectedFiles = function () {

    loadContentFromSelectedFiles().then(function () {
        var inputFileContainers = createInputFileContainers();
        selectedFilesContainer.updateView();

        _.defer(function () {
            converter.convert(inputFileContainers, transactionCategorizer, handleConversionResults);
        });
    });

};

/*
 * Read the file content from each input file.
 *
 * Returns a promise which will be fulfilled when the reading is done.
 */
var loadContentFromSelectedFiles = function () {
    var promises = [];
    var mainDeferred = Q.defer();

    _.each(selectedFilesContainer.selectedFiles, function (selectedFile) {
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

var createInputFileContainers = function () {
    return _.chain(selectedFilesContainer.selectedFiles)
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

/*
 * Setup the file chooser button.
 */
var setupFileInput = function () {
    var $fileInput = $('#fileChooser input[type=file]');

    $fileInput.on('change', function () {
        /*
         * Create a SelectedFile for each input file the user has chosen.
         */
        _.each($fileInput[0].files, function (file) {
            var selectedFile = Object.create(baseSelectedFile);
            selectedFile.file = file;
            selectedFile.filename = file.name;

            selectedFilesContainer.addSelectedFile(selectedFile);
        });

        selectedFilesContainer.updateView();
    });
};

$(function () {
    baseSelectedFile.template = $('#selectedFileTemplate').html();
    mustache.parse(baseSelectedFile.template);

    setupFileInput();
});
