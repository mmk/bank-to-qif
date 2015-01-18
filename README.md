# Bank-to-qif

**Not ready for production yet!**

Bank-to-qif is a JavaScript application that can be used to convert bank CSV files into a QIF file, which can be imported into GnuCash or other accounting software.

The application comes with a simple web user interface, but it does not require a backend server. You can use bank-to-qif in the browser through a file url.

## Features

* Generate a single QIF file for multiple bank accounts at the same time.
* Supported input file types:
  * CSV from OP online bank (Finland)
  * CSV from Nordea online bank (Finland)
* Automatically categorize transactions.
  * Bank-to-qif uses regular expressions to categorize transactions, which enables it to categorize even transactions with previously unknown payers/payees.
  * For example, you can set the expense account of restaurant payments to be "Expenses:Dining" and the expense account of grocery payments to be "Expenses:Groceries". You can specify words such as "supermarket" or "restaurant" that will be used to decide the right category.
* Detect transfers between user's own accounts and remove duplicate transactions.
