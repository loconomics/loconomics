/** MailFolder model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function MailFolder(values) {

    Model(this);

    this.model.defProperties({
        messages: [],
        topNumber: 10
    }, values);
    
    this.top = ko.pureComputed(function top(num) {
        if (num) this.topNumber(num);
        var t = this.topNumber() - 1;
        var ret = [];
        this.messages().some(function(e, i) {
            if (i >= t) {
                // stop
                return true;
            }
            ret.push(e);
        });
        return ret;
    }, this);
}

module.exports = MailFolder;
