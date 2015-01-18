module.exports = {

    selfRegExps: [
        /john smith/i, /smith john/i
    ],

    accounts: [
        {
            fileType: 'op',
            inputEncoding: 'iso-8859-15',
            ibanAccountNumber: 'FI11 2222 2323 4444 55',
            accountName: 'Assets:Current Assets:First OP account'
        },
        {
            fileType: 'op',
            inputEncoding: 'iso-8859-15',
            ibanAccountNumber: 'FI22 3333 4444 5555 66',
            accountName: 'Assets:Current Assets:Second OP account'
        },
        {
            fileType: 'nordea',
            inputEncoding: 'utf8',
            ibanAccountNumber: 'FI99 8888 7777 6666 55',
            accountName: 'Assets:Current Assets:First Nordea account'
        },
        {
            fileType: 'nordea',
            inputEncoding: 'utf8',
            ibanAccountNumber: 'FI88 7777 6666 5555 44',
            accountName: 'Assets:Current Assets:Second Nordea account'
        }
    ]

};
