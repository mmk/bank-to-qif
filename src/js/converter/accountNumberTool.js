/*
 * Tool to handle all trouble with account numbers.
 *
 * See [1] for some specifications.
 *
 * [1] http://en.wikipedia.org/wiki/International_Bank_Account_Number
 */

'use strict';

var _ = require('underscore');

/*
 * Convert a Finnish IBAN number into a traditional Finnish account number.
 *
 * The format of Finnish IBAN numbers is "FIkk bbbb bbcc cccc cx", where:
 *
 * kk = IBAN checksum
 * b  = Bank and branch code
 * c  = Account number
 * x  = National check digit
 */
var ibanToTraditionalFinnish = _.memoize(function (iban) {
    if (!iban || typeof iban !== 'string') {
        return null;
    }

    if (!iban.match(/^FI/)) {
        return null; // Only Finnish account numbers are supported for now
    }

    var input = iban.replace(/\s/g, '');

    if (input.length !== 18) {
        return null;
    }

    input = input.replace(/^..../, '');

    var firstPart = input.slice(0, 6);
    var secondPart = input.slice(6).replace(/^0*/, '');

    return firstPart + '-' + secondPart;
});

module.exports = {
    ibanToTraditionalFinnish: ibanToTraditionalFinnish
};
