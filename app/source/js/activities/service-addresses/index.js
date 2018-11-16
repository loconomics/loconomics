/**
 * ServiceAddresses
 *
 * @module activities/service-addresses
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import ServiceAddressesVM from '../../viewmodels/ServiceAddresses';
import UserJobProfile from '../../viewmodels/UserJobProfile';
import UserType from '../../enums/UserType';
import clientAddresses from '../../data/clientAddresses';
import { item as getUserListing } from '../../data/userListings';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import serviceAddresses from '../../data/serviceAddresses';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'service-addresses';

export default class ServiceAddresses extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201965996-setting-your-service-locations-areas';
        this.navBar = Activity.createSubsectionNavBar('Job Title', {
            backLink: '/scheduling',
            helpLink: this.helpLink
        });
        // Save defaults to restore on updateNavBarState when needed:
        this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);
        this.title = ko.pureComputed(() => {
            if(this.isInOnboarding() && this.serviceAddresses.sourceAddresses().length === 0) {
                return 'Where do you work as a ' + this.listingTitle() + '?';
            }
            else if (this.isInOnboarding()) {
                return 'Location for your listing';
            }
            else if(this.serviceAddresses.isSelectionMode()) {
                return 'Choose a place for this booking';
            }
            else {
                return 'Location';
            }
        });

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectData();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        this.serviceAddresses = new ServiceAddressesVM();
        this.addLocationLabel = ko.pureComputed(() => this.isInOnboarding() && 'Place clients come to see you' || 'Add a service location');
        this.addAreaLabel = ko.pureComputed(() => this.isInOnboarding() && 'Area where you go to clients' || 'Add a service area/radius');
        this.jobTitleID = ko.observable(0);
        // Optionally, some times a clientUserID can be passed in order to create
        // a location for that client where perform a work.
        this.clientUserID = ko.observable(null);
        this.clientAddresses = new ServiceAddressesVM();
        // The list of client addresses is used only in selection mode
        this.clientAddresses.isSelectionMode(true);
        this.showSupportingText = ko.pureComputed(() => !(this.clientAddresses.hasAddresses() || this.serviceAddresses.isSelectionMode()));
        this.listingTitle = ko.observable('Job Title');
        this.jobTitles = new UserJobProfile();
        this.jobTitles.baseUrl('/service-addresses');
        this.isSyncing = serviceAddresses.state.isSyncing();
        this.isLoading = ko.pureComputed(() => {
            var add = serviceAddresses.state.isLoading();
            var jobs = this.jobTitles.isLoading();
            var cli = clientAddresses.state.isLoading();
            return add || jobs || cli;
        });
        this.onboardingNextReady = ko.pureComputed(() => {
            var isin = onboarding.inProgress();
            var hasItems = this.serviceAddresses.sourceAddresses().length > 0;
            return isin && hasItems;
        });
    }

    __defViewMethods() {
        // Go back with the selected address when triggered in the form/view
        this.returnSelected = (addressID, jobTitleID) => {
            // Pass the selected client in the info
            this.requestData.selectedAddressID = addressID;
            this.requestData.selectedJobTitleID = jobTitleID;
            // And go back
            shell.goBack(this.requestData);
        };
        this.returnAddress = (addressDetails) => {
            this.requestData.address = addressDetails;
            // And go back
            shell.goBack(this.requestData);
        };
        this.returnRequest = () => shell.goBack(this.requestData);
        this.goNext = () => {
            if (onboarding.inProgress()) {
                // Ensure we keep the same jobTitleID in next steps as here:
                onboarding.selectedJobTitleID(this.jobTitleID());
                onboarding.goNext();
            }
        };
        // Replace default selectAddress
        this.serviceAddresses.selectAddress = (selectedAddress, event) => {
            if (this.serviceAddresses.isSelectionMode() === true) {
                // Run method injected by the activity to return a
                // selected address:
                this.returnSelected(
                    selectedAddress.addressID(),
                    selectedAddress.jobTitleID()
                );
            }
            else {
                shell.go('address-editor/service/' +
                    this.jobTitleID() +
                    '/' + selectedAddress.addressID()
                );
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        this.clientAddresses.selectAddress = (selectedAddress, event) => {
            if (this.clientAddresses.isSelectionMode() === true) {
                // Run method injected by the activity to return a
                // selected address:
                this.returnAddress(selectedAddress.model.toPlainObject());
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        this.addServiceLocation = () => {
            var url = `#!address-editor/service/${this.jobTitleID()}/serviceLocation`;
            var request = $.extend({}, this.requestData, {
                returnNewAsSelected: this.serviceAddresses.isSelectionMode()
            });
            shell.go(url, request);
        };
        this.addServiceArea = () => {
            var url = `#!address-editor/service/${this.jobTitleID()}/serviceArea`;
            var request = $.extend({}, this.requestData, {
                returnNewAsSelected: this.serviceAddresses.isSelectionMode()
            });
            shell.go(url, request);
        };
        this.addClientLocation = () => {
            var url = `#!address-editor/service/${this.jobTitleID()}/clientLocation/${this.clientUserID()}`;
            var request = $.extend({}, this.requestData, {
                returnNewAsSelected: this.serviceAddresses.isSelectionMode()
            });
            shell.go(url, request);
        };
    }

    __connectData() {
        // On changing clientUserID: load its addresses
        this.registerHandler({
            target: this.clientUserID,
            handler: (clientUserID) => {
                if (clientUserID) {
                    clientAddresses
                    .getList(clientUserID)
                    .then((list) => {
                        list = this.clientAddresses.asModel(list);
                        this.clientAddresses.sourceAddresses(list);
                        if (this.requestData.selectedAddressID) {
                            this.clientAddresses.presetSelectedAddressID(this.requestData.selectedAddressID);
                        }
                    });
                }
                else {
                    this.clientAddresses.sourceAddresses([]);
                    this.clientAddresses.selectedAddress(null);
                }
            }
        });
    }

    applyOwnNavbarRules() {
        /* eslint complexity:"off" */
        var itIs = this.serviceAddresses.isSelectionMode();

        if (this.requestData.title) {
            // Replace title by title if required
            this.navBar.title(this.requestData.title);
        }
        else {
            // Title must be empty
            this.navBar.title('');
        }

        if (this.requestData.cancelLink) {
            this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink, this.requestData);
        }
        else {
            // Reset to defaults, or given title:
            this.navBar.leftAction().model.updateWith(this.defaultLeftAction, true);

            var jid = this.jobTitleID();
            var jname = this.listingTitle() || 'Scheduler';
            var url = this.mustReturnTo || (jid && '/listing-editor/' + jid || '/scheduling-preferences');

            this.navBar.leftAction().link(url);
            this.navBar.leftAction().text(this.requestData.navTitle || jname);
        }

        if (itIs && !this.requestData.cancelLink) {
            // Uses a custom handler so it returns keeping the given state:
            this.navBar.leftAction().handler(this.returnRequest);
        }
        else if (!this.requestData.cancelLink) {
            this.navBar.leftAction().handler(null);
        }
    }

    updateNavBarState() {
        // Perform updates that apply this request:
        return onboarding.updateNavBar(this.navBar) || this.applyOwnNavbarRules();
    }

    useJobTitle(jobTitleID) {
        this.jobTitleID(jobTitleID);
        // Data for listing
        if (jobTitleID) {
            // Get Listing Title
            const listingDataProvider = getUserListing(jobTitleID);
            this.subscribeTo(listingDataProvider.onData, (listing) => {
                this.listingTitle(listing.title);
                this.updateNavBarState();
            });
            this.subscribeTo(listingDataProvider.onDataError, (error) => {
                showError({
                    title: 'Unable to load listing details.',
                    error
                });
            });
            // Get data for the Job title ID
            return serviceAddresses.getList(jobTitleID)
            .then((list) => {
                list = serviceAddresses.asModel(list);
                this.serviceAddresses.sourceAddresses(list);
                if (this.requestData.selectedAddressID) {
                    this.serviceAddresses.presetSelectedAddressID(this.requestData.selectedAddressID);
                }
            })
            .catch(function (error) {
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
        }
        else {
            // Load titles to display for selection
            this.jobTitles.sync();
        }
    }

    /**
     * URL pattern /{jobTitleID}.
     * Several state properties are expected to pass internally between activities.
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments
     * {number} segments[0] The jobTitleID to load address for
     * @param {boolean} [state.selectAddress] Whether enter selection mode and return
     * selected as `state.address`
     * @param {number} [state.clientUserID] Request just address created for a given client
     * @param {boolean} [state.returnNewAsSelected] Whether in selection mode, if
     * user have went to add a new address (since available ones didn't fit the needs)
     * that one should be automatically as selected. This prop is provided
     * forward and back with the address editor.
     * @param {Object} [state.address] New unsaved address details from editor that
     * must be provided back
     * @param {Object} [state.addressID] New saved address from editor that must
     * be provided back
     */
    show(state) {
        super.show(state);

        // Remember route to go back, from a request of 'mustReturn' or last requested
        this.mustReturnTo = state.route.query.mustReturn || this.mustReturnTo;

        // Communication between activities through state props:
        this.serviceAddresses.isSelectionMode(state.selectAddress === true);
        this.clientUserID(state.clientUserID || null);
        // Check if it comes from an address-editor that
        // received the flag 'returnNewAsSelected': we were in selection mode->creating address->must
        // return the just created address to the previous page
        if (state.returnNewAsSelected === true) {
            setTimeout(() => {
                delete state.returnNewAsSelected;
                if (state.address)
                this.returnAddress(state.address);
                else if (state.addressID)
                this.returnSelected(state.addressID, jobTitleID);
            }, 1);
            // quick return
            return;
        }

        // TODO: Check if this reset is still needed with new lifecycle (maybe chaning
        // the registerHandler too):
        // Reset: avoiding errors because persisted data for different ID on loading
        // or outdated info forcing update
        this.clientUserID(0);
        this.listingTitle('Job Title');
        this.serviceAddresses.sourceAddresses([]);
        this.serviceAddresses.selectedAddress(null);

        // URL positional params at segments
        const params = state.route.segments;
        const jobTitleID = params[0] |0;

        this.useJobTitle(jobTitleID);
        this.updateNavBarState();
    }
}

activities.register(ROUTE_NAME, ServiceAddresses);
