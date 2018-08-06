/**
 * Booking Policies activity
 *
 * @module activities/booking-policies
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserJobProfile from '../../viewmodels/UserJobProfile';
import UserJobTitle from '../../models/UserJobTitle';
import UserType from '../../enums/UserType';
import cancellationPolicies from '../../data/cancellationPolicies';
import ko from 'knockout';
import paymentAccount from '../../data/paymentAccount';
import payoutPreferenceRequired from '../../modals/payoutPreferenceRequired';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { item as userListingItem } from '../../data/userListings';

const ROUTE_NAME = 'booking-policies';

export default class BookingPolicies extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/sections/202884403-Setting-Your-Booking-Policies';
        this.navBar = Activity.createSubsectionNavBar('Listing', {
            backLink: 'listingEditor',
            helpLink: this.helpLink
        });
        this.title = ko.pureComputed(() => `${this.listingTitle()} booking policies`);

        // TODO: Refactor
        this.jobTitleID = ko.observable(0);
        this.userJobTitle = ko.observable(null);
        this.listingTitle = ko.observable('Job Title');
        // Local copy of the cancellationPolicyID, rather than use
        // it directly from the userJobTitle to avoid that gets saved
        // in memory without press 'save'
        this.selectedCancellationPolicyID = ko.observable(null);
        this.instantBooking = ko.observable(null);

        this.isLoading = ko.observable(false);
        this.isSaving = ko.observable(false);
        this.isLocked = ko.pureComputed(() =>  this.isLoading() || this.isSaving());

        this.jobTitles = new UserJobProfile(app);
        this.jobTitles.baseUrl('/' + ROUTE_NAME);

        this.submitText = ko.pureComputed(function() {
            return (
                this.isLoading() ?
                    'loading...' :
                    this.isSaving() ?
                        'saving...' :
                        'Save'
            );
        }, this);

        /**
         * It validates if instantBooking is allowed prior save
         * @returns {Promise<boolean>} Whether satisfy validation or not
         */
        this.validateInstantBooking = function() {
            return paymentAccount.whenLoaded()
            .then(function() {
                return !this.instantBooking() || paymentAccount.data.isReady();
            }.bind(this));
        };

        var performSave = function() {
            var ujt = this.userJobTitle();
            if (ujt) {
                this.isSaving(true);

                var plain = ujt.model.toPlainObject();
                plain.cancellationPolicyID = this.selectedCancellationPolicyID();
                plain.instantBooking = this.instantBooking();

                userListingItem(this.jobTitleID())
                .save(plain)
                .then(function() {
                    this.isSaving(false);
                    app.successSave();
                }.bind(this))
                .catch(function(err) {
                    this.isSaving(false);
                    showError({ title: 'Unable to save booking policies', error: err });
                }.bind(this));
            }
        }.bind(this);

        this.save = function() {
            this.validateInstantBooking()
            .then(function(isValid) {
                if (isValid) {
                    performSave();
                }
                else {
                    // Direct user to set-up a payout preference
                    payoutPreferenceRequired.show({
                        reason: payoutPreferenceRequired.Reason.enablingInstantBooking
                    })
                    .then(function(done) {
                        if (done) {
                            performSave();
                        }
                    })
                    .catch(function(err) {
                        showError({
                            title: 'Unable to set-up payout preference',
                            error: err
                        });
                    });
                }
            });

        }.bind(this);

        this.policies = cancellationPolicies.list;
    }

    /**
     *
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array} state.route.segments Requires the jobTitleID as the
     * first element in the path segments
     * {(number|string)} segments[0]
     */
    show(state) {
        super.show(state);

        const jobTitleID = state.route.segments[0] |0;

        this.__connectJobTitle(jobTitleID);

        // Request to sync policies, just in case there are remote changes
        cancellationPolicies.sync();
        paymentAccount.sync();
        if (!jobTitleID) {
            // Load titles to display for selection
            this.jobTitles.sync();
        }
    }

    /**
     *
     * @param {number} jobTitleID Job Title to load info and policies
     */
    __connectJobTitle(jobTitleID) {
        this.jobTitleID(jobTitleID);
        this.listingTitle('Job Title');
        this.userJobTitle(null);
        this.selectedCancellationPolicyID(null);
        this.instantBooking(null);
        // Load data by the listing job title
        if (jobTitleID) {
            this.isLoading(true);
            userListingItem(jobTitleID).onceLoaded()
            .then((listing) => {
                // Direct copy of listing values
                this.listingTitle(listing.title);
                this.selectedCancellationPolicyID(listing.cancellationPolicyID);
                this.instantBooking(listing.instantBooking);
                // Save for use in the view
                this.userJobTitle(new UserJobTitle(listing));
                this.isLoading(false);
            })
            .catch((error) => {
                this.isLoading(false);
                showError({
                    title: 'There was an error while loading booking policies.',
                    error
                });
            });
        }
    }
}

activities.register(ROUTE_NAME, BookingPolicies);
