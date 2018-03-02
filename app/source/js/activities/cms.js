/**
    CMS activity
    (Client Management System)
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var clients = require('../data/clients');
var showError = require('../modals/error').show;

var A = Activity.extend(function CmsActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();

    this.accessLevel = this.app.UserType.loggedUser;
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Client manager');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Keep data updated:
    if (this.dataSub) this.dataSub.dispose();
    if (this.errorSub) this.dataSub.dispose();
    this.dataSub = clients.list.onData.subscribe((data) => {
        this.viewModel.totalClients(data.length);
    });
    this.errorSub = clients.list.onDataError.subscribe(function(err) {
        showError({
            title: 'Error loading the clients list',
            error: err
        });
    });
};

A.prototype.hide = function() {
    Activity.prototype.hide.call(this);

    if (this.dataSub) this.dataSub.dispose();
    if (this.errorSub) this.dataSub.dispose();
};

var numeral = require('numeral');

function ViewModel() {

    this.totalClients = ko.observable(0);

    this.clientsCount = ko.pureComputed(function() {
        var cs = this.totalClients();
        if (cs <= 0)
            return '0 clients';
        else if (cs === 1)
            return '1 client';
        else
            return numeral(cs |0).format('0,0') + ' clients';
    }, this);
}
