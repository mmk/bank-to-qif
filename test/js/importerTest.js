/* jshint expr: true */

/*
 * Test cases for both opBankImporter.js and nordeaBankImporter.js.
 */

'use strict';

var should = require('should');
var fs     = require('fs');
var iconv  = require('iconv-lite');

var opBankImporter     = require('../../src/js/converter/opBankImporter');
var nordeaBankImporter = require('../../src/js/converter/nordeaBankImporter');

var describeImporterFunctions = function (importer, fileContent, expectedTransactionCount) {
    describe('#isSupportedFile()', function () {
        it('should return false when the file is invalid', function () {
            importer.isSupportedFile(null).should.be.false;
            importer.isSupportedFile('').should.be.false;
        });

        it('should return true when the file is valid', function () {
            importer.isSupportedFile(fileContent).should.be.true;
        });
    });

    describe('#importTransactions()', function () {
        it('should return a promise that is rejected when the file is invalid', function (done) {
            importer.importTransactions(null).catch(function () {
                done();
            });
        });

        it('should import transactions correctly when the file is valid', function (done) {
            importer.importTransactions(fileContent).then(function (transactions) {
                try {
                    should(transactions).not.be.null;
                    transactions.should.be.instanceof(Array).have.lengthOf(expectedTransactionCount);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });
};

describe('opBankImporter', function() {
    var fileContentBuffer = fs.readFileSync(__dirname + '/../data/op-bank_account1.csv');
    var fileContent = iconv.decode(fileContentBuffer, 'iso-8859-15');

    describeImporterFunctions(opBankImporter, fileContent, 9);
});

describe('nordeaBankImporter', function() {
    var fileContent = fs.readFileSync(__dirname + '/../data/nordea-bank_account1.csv', { encoding: 'utf8' });

    describeImporterFunctions(nordeaBankImporter, fileContent, 7);
});
