/*
 * Helper functions for importers.
 */

'use strict';

var _ = require('underscore');

/*
 * Create a Date object from a string representation of a date.
 * The input string must be in the format of "dd.mm.yyyy".
 *
 * Returns a Date object if parsing succeeds, otherwise null.
 */
var parseDate = function (dateStr) {
    if (!dateStr) {
        return null;
    }

    var fields = dateStr.split('.');
    if (fields.length !== 3) {
        return null;
    }

    var day = parseInt(fields[0], 10);
    var month = parseInt(fields[1], 10);
    var year = parseInt(fields[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
    }

    return new Date(year, month - 1, day);
};

/*
 * Convert a Date object into a string in the format of "dd/mm/yyyy".
 * Return the resulting string on success, otherwise null.
 */
var dateToString = function (date) {
    if (!(date instanceof Date)) {
        return null;
    }

    var padIfNeeded = function (num) {
        return (num < 10 ? '0' : '') + num;
    };

    return padIfNeeded(date.getDate()) + '/' + padIfNeeded(date.getMonth() + 1) + '/' + date.getFullYear();
};

var parseAmount = function (inputStr) {
    if (typeof(inputStr) !== 'string') {
        return null;
    }

    inputStr = inputStr.replace(/,/, '.').replace(/\s/g, '');

    if (inputStr.match(/^-?\d+\.?\d*$/)) {
        return parseFloat(inputStr);
    }

    return null;
};

module.exports = {
    parseDate: parseDate,
    dateToString: dateToString,
    parseAmount: parseAmount
};
