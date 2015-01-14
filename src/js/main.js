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

var selectedFilesContainer = (function () {

    /*
     * Detect and mark any selectedFiles for which the user has chosen a duplicate account.
     * There can only be one input file per account.
     */
    var detectAndMarkDuplicateAccounts = function () {
        var accountNames = {};
        var duplicateAccountNames = {};

        _.chain(this.selectedFiles)
            .filter(function (selectedFile) {
                return selectedFile.account;
            })
            .each(function (selectedFile) {
                var name = selectedFile.account.accountName;

                if (_.has(accountNames, name)) {
                    duplicateAccountNames[name] = true;
                }

                accountNames[name] = true;
            });

        _.each(this.selectedFiles, function (selectedFile) {
            selectedFile.duplicate =
                selectedFile.account && _.has(duplicateAccountNames, selectedFile.account.accountName);

            if (selectedFile.duplicate) {
                selectedFile.setStatus('danger', new Error('Only one input file per account allowed'));
            }
        });
    };

    var tryToConvert = function () {
        detectAndMarkDuplicateAccounts.call(this);
        this.updateView();

        tryToConvertSelectedFiles();
    };

    return {
        $el: $('#selectedFilesContainer'),
        selectedFiles: [],

        updateView: function () {
            var invalidOrMissing = false;

            _.each(this.selectedFiles, function (selectedFile) {
                selectedFile.updateView();

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

        accountChanged: function () {
            tryToConvert.call(this);
        },

        removeSelectedFile: function (selectedFile) {
            selectedFile.$el.remove();

            this.selectedFiles = _.reject(this.selectedFiles, function (sf) {
                return sf.id === selectedFile.id;
            });

            tryToConvert.call(this);
        },

        createSelectedFile: function (file) {
            var selectedFile = Object.create(baseSelectedFile);
            selectedFile.initId();

            selectedFile.file = file;
            selectedFile.filename = file.name;

            selectedFile.accountChangedCB = _.bind(this.accountChanged, this);
            selectedFile.removeCB = _.bind(this.removeSelectedFile, this);

            var $selectedFileEl = selectedFile.render();
            this.$el.append($selectedFileEl);

            this.selectedFiles.push(selectedFile);
        }
    };

})();

/*
 * "Selected files" are input file chosen by the user. The object baseSelectedFile is in
 * the prototype chain of every selectedFile object.
 */
var baseSelectedFile = (function () {

    var template = $('#selectedFileTemplate').html();
    mustache.parse(template);

    var onChangeAccount = function (accountChooser) {
        var selectedIndex = accountChooser.selectedIndex;
        this.account = (selectedIndex === 0 ? null : accountConfig[selectedIndex - 1]);

        if (this.accountChangedCB) {
            this.accountChangedCB();
        }
    };

    var renderAccountChooser = function () {
        var $select = $('<select></select>');
        $select.append('<option value="-1">Choose bank account</option>');

        _.each(accountConfig, function (accountConfigItem) {
            var $option = $('<option></option>');
            $option.append(accountConfigItem.accountName);
            $select.append($option);
        });

        return $select;
    };

    return {
        id: null,
        filename: null,
        file: null,
        fileContent: null,
        account: null,
        status: 'default',
        error: null,
        duplicate: false,
        $el: null,

        // Callbacks
        accountChangedCB: null,
        removeCB: null,

        /*
         * Initialize with a unique id.
         */
        initId: (function () {
            var latestId = 0;

            return function () {
                latestId += 1;
                this.id = latestId;
            };
        })(),

        setStatus: function (status, error) {
            this.status = status;
            this.error = error || null;
        },

        updateView: function () {
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
                $error.text(this.error.message || 'Error');
            }
            else {
                $errorRow.addClass('hidden');
            }
        },

        render: function () {
            this.$el = $(mustache.render(template, {
                filename: this.filename,
                status: this.status
            }));

            var $accountChooser = renderAccountChooser.call(this);
            this.$el.find('.accountChooser').append($accountChooser);

            $accountChooser.on('change', _.bind(onChangeAccount, this, $accountChooser[0]));

            this.$el.find('a[data-class=removeFile]').on('click', _.bind(function () {
                if (this.removeCB) {
                    this.removeCB(this);
                }
            }, this));

            return this.$el;
        }
    };

})();

var handleConversionResults = function (outputAccounts, qifFileContent, loadedSelectedFiles) {

    _.chain(loadedSelectedFiles)
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

    loadContentFromSelectedFiles().then(function (loadedSelectedFiles) {
        var inputFileContainers = createInputFileContainers(loadedSelectedFiles);
        selectedFilesContainer.updateView();

        _.defer(function () {
            converter.convert(inputFileContainers, transactionCategorizer, function (outputAccounts, qifFileContent) {
                handleConversionResults(outputAccounts, qifFileContent, loadedSelectedFiles);
            });
        });
    });

};

/*
 * Read the file content from each input file.
 *
 * Returns a promise which will be fulfilled when the reading is done.
 */
var loadContentFromSelectedFiles = function () {
    var loadedSelectedFiles = [];
    var promises = [];
    var mainDeferred = Q.defer();

    _.each(selectedFilesContainer.selectedFiles, function (selectedFile) {
        if (selectedFile.duplicate) {
            return;
        }

        if (!selectedFile.file || !selectedFile.account) {
            selectedFile.fileContent = null;
            selectedFile.setStatus('default');
            return;
        }

        loadedSelectedFiles.push(selectedFile);

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
        mainDeferred.resolve(loadedSelectedFiles);
    });

    return mainDeferred.promise;
};

var createInputFileContainers = function (loadedSelectedFiles) {
    return _.map(loadedSelectedFiles, function (selectedFile) {
        return _.chain(selectedFile.account)
            .pick('fileType', 'ibanAccountNumber', 'accountName')
            .extend({
                fileContent: selectedFile.fileContent,
                selectedFile: selectedFile
            })
            .value();
    });
};

/*
 * Setup the file chooser button.
 */
var setupFileInput = function () {
    var $fileInput = $('#fileChooser input[type=file]');

    $fileInput.on('change', function () {
        /*
         * Create a "selected file" for each input file the user has chosen.
         */
        _.each($fileInput[0].files, function (file) {
            selectedFilesContainer.createSelectedFile(file);
        });

        selectedFilesContainer.updateView();
    });
};

$(function () {
    setupFileInput();
});
