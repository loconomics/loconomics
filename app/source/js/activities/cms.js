/**
    CMS activity
    (Client Management System)
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
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
    this.title('Clients');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Keep data updated:
    clients.sync()
    .catch(function(err) {
        showError({
            title: 'Error loading the clients list',
            error: err
        });
    });
};

var numeral = require('numeral');

function ViewModel() {

    this.clients = clients.list;

    this.clientsCount = ko.pureComputed(function() {
        var cs = this.clients();

        if (cs <= 0)
            return '0 clients';
        else if (cs === 1)
            return '1 client';
        else
            return numeral(cs.length |0).format('0,0') + ' clients';
    }, this);
}
