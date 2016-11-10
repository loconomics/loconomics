/** Cancellation Policies

    TODO: Implement REST SERVICE, right now it uses preset data
**/
'use strict';

var CancellationPolicy = require('../models/CancellationPolicy');
var ListRemoteModel = require('../utils/ListRemoteModel');

// PRESET
var data = [
    new CancellationPolicy({
        cancellationPolicyID: 3,
        name: 'Flexible',
        description: 'No cancellation fees if changed or cancelled at least 24 hours in advance, otherwise a cancellation fee of 50% the price of booked services apply (including no-shows).',
        hoursRequired: 24,
        cancellationFeeBefore: 0,
        cancellationFeeAfter: 0.5
    }),
    new CancellationPolicy({
        cancellationPolicyID: 2,
        name: 'Moderate',
        description: 'No cancellation fees if changed or cancelled at least 24 hours in advance, otherwise a cancellation fee of 100% the price of booked services apply (including no-shows).',
        hoursRequired: 24,
        cancellationFeeBefore: 0,
        cancellationFeeAfter: 1.0
    }),
    new CancellationPolicy({
        cancellationPolicyID: 1,
        name: 'Strict',
        description: 'Cancellation fees of 50% of the price of booked services up to 5 days before the booking start time and 100% after.',
        hoursRequired: 120,
        cancellationFeeBefore: 0.5,
        cancellationFeeAfter: 1.0
    })
];

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        // Types does not changes usually, so big ttl
        listTtl: { days: 1 },
        itemIdField: 'cancellationPolicyID',
        Model: CancellationPolicy
    });

    //api.addLocalforageSupport('cancellation-policies');
    //api.addRestSupport(appModel.rest, 'cancellation-policies');
    
    appModel.on('clearLocalData', function() {
    //    api.clearCache();
    });
    
    // Replace cached list with preset data
    api.list(data);

    // Replace getList to just return the preset
    api.getList = function() {
        return Promise.resolve(data);
    };

    return api;
};
