/**
    CMS activity
    (Client Management System)
**/
'use strict';

import Activity from '../components/Activity';
import { list as clientsList } from '../data/clients';
import ko from 'knockout';
import { show as showError } from'../modals/error';

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
    this.subscribeTo(clientsList.onData, (data) => {
        this.viewModel.totalClients(data.length);
    });
    this.subscribeTo(clientsList.onDataError, (err) => {
        showError({
            title: 'Error loading the clients list',
            error: err
        });
    });
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
