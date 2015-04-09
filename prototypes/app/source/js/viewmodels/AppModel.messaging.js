/** AppModel for messaging: threads and messages

    NOTE: Initial basic implementation
    TODO: Require advanced implementation, loading a limited
        amount of records for threads and messages per thread
        using the cursor parameters of the REST API to manage
        paging load.
**/
'use strict';

var Thread = require('../models/Thread');

var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        listTtl: { minutes: 1 },
        itemIdField: 'threadID',
        Model: Thread
    });

    api.addLocalforageSupport('messaging');
    api.addRestSupport(appModel.rest, 'messaging');

    return api;
};
