/** Clients test data **/
var Client = require('../models/Customer');

var testData = [
    new Client ({
        customerUserID: 1,
        firstName: 'Joshua',
        lastName: 'Danielson'
    }),
    new Client({
        customerUserID: 2,
        firstName: 'Iago',
        lastName: 'Lorenzo'
    }),
    new Client({
        customerUserID: 3,
        firstName: 'Fernando',
        lastName: 'Gago'
    }),
    new Client({
        customerUserID: 4,
        firstName: 'Adam',
        lastName: 'Finch'
    }),
    new Client({
        customerUserID: 5,
        firstName: 'Alan',
        lastName: 'Ferguson'
    }),
    new Client({
        customerUserID: 6,
        firstName: 'Alex',
        lastName: 'Pena'
    }),
    new Client({
        customerUserID: 7,
        firstName: 'Alexis',
        lastName: 'Peaca'
    }),
    new Client({
        customerUserID: 8,
        firstName: 'Arthur',
        lastName: 'Miller'
    })
];

exports.clients = testData;
