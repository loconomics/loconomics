/**
    listings activity
**/
'use strict';
import '../kocomponents/external-listing/list';
import '../kocomponents/utilities/icon-dec.js';
import Activity from '../components/Activity';
import UserJobProfileViewModel from '../viewmodels/UserJobProfile';
import UserType from '../enums/UserType';

var A = Activity.extend(function ListingsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = UserType.serviceProfessional;
    this.viewModel = new UserJobProfileViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Your Listings');

    this.viewModel.showMarketplaceInfo(true);
    this.viewModel.baseUrl('/listingEditor');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();
};
