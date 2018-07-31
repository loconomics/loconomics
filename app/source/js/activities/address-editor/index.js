/**
 * AddressEditor activity
 *
 * @module activities/address-editor
 *
 * TODO: This requires an important refactor to make a dummy editor component,
 * where the remaining activity is just to edit service addresses as an individual
 * task and any usage of this as a step of an booking edition or similar must
 * be removed (using the component directly instead).
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */
/*
    Comments from original activity. Take care that some behaviors and implementation
    details are deprecated/unwanted

    TODO: ModelVersion is NOT being used, so no getting updates if server updates
    the data after load (data load is requested but get first from cache). Use
    version and get sync'ed data when ready, and additionally notification to
    override changes if server data is different that any local change.

    TODO: The URL structure and how params are read is ready to allow
    edition of different kind of addresses, but actually only service addresses
    are fully supported, since 'home address' is edited in contactInfo and
    'billing addresses' are not used currently, but when needed, the support for this
    last will need to be completed. All the API calls right now are
    for model.serviceAdddresses for example.
*/

import * as activities from '../index';
import Activity from '../../components/Activity';
import Address from '../../models/Address';
import PostalCodeVM from '../../viewmodels/PostalCode';
import UserType from '../../enums/UserType';
import { item as getUserListing } from '../../data/userListings';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import serviceAddresses from '../../data/serviceAddresses';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'address-editor';

export default class AddressEditorActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        /* eslint max-statements:off */
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201965996-setting-your-service-locations-areas';
        this.navBar = Activity.createSubsectionNavBar('Locations', {
            backLink: '/scheduling',
            helpLink: this.helpLink
        });
        this.title('Edit location');

        /// TODO: Refactor original ViewModel members following:

        this.isInOnboarding = onboarding.inProgress;

        this.titleIcon = ko.observable('ion-ios-location-outline');
        this.formInstructions = ko.observable('');
        // List of possible error messages registered
        // by name
        this.errorMessages = {
            postalCode: ko.observable('')
        };

        this.jobTitleID = ko.observable(0);
        this.addressID = ko.observable(0);
        this.clientUserID = ko.observable(0);
        this.listingTitle = ko.observable('Job Title');

        this.addressVersion = ko.observable(null);
        this.address = ko.pureComputed(() => {
            var v = this.addressVersion();
            if (v) {
                return v.version;
            }
            return null;
        });

        // On change to a valid code, do remote look-up
        this.postalCodeVM = new PostalCodeVM({
            address: this.address,
            postalCodeError: this.errorMessages.postalCode
        });

        this.isLoading = serviceAddresses.state.isLoading;
        this.isSaving = serviceAddresses.state.isSaving;
        this.isDeleting = serviceAddresses.state.isDeleting;

        this.wasRemoved = ko.observable(false);

        this.isLocked = ko.pureComputed(() =>  this.isDeleting() || serviceAddresses.state.isLocked());

        this.isNew = ko.pureComputed(() => {
            var add = this.address();
            return !add || !add.updatedDate();
        });

        this.submitText = ko.pureComputed(() => {
            var v = this.addressVersion();
            return (
                this.isLoading() ?
                    'Loading...' :
                    this.isSaving() ?
                        'Saving changes' :
                        v && v.areDifferent() ?
                            'Save changes' :
                            'Saved'
            );
        });

        this.unsavedChanges = ko.pureComputed(() => {
            var v = this.addressVersion();
            return v && v.areDifferent();
        });

        this.deleteText = ko.pureComputed(() => {
            const t = (
                this.isDeleting() ?
                    'Deleting...' :
                    'Delete'
            );
            return t;
        });

        this.save = () => {
            if (this.clientUserID()) {
                // We want to return the in-memory data for the address rather
                // than save it.
                // NOTE: This feature 'clientLocation' is used by the serviceProfessional booking
                // process to use a 'new client location' as address rather than a new serviceProfessiona address
                // Just call the onSave, it knows what to do
                this.onSave();
            }
            else {
                // Normal use: save the user (serviceProfessional) address and provide the generated
                // addressID to the onSave method.
                serviceAddresses.setItem(this.address().model.toPlainObject())
                .then(function(serverData) {
                    // Update version with server data.
                    this.address().model.updateWith(serverData);
                    // Push version so it appears as saved
                    this.addressVersion().push({ evenIfObsolete: true });

                    // Special save, function provided by the activity on set-up
                    this.onSave(serverData.addressID);
                }.bind(this))
                .catch(function(err) {
                    showError({
                        title: 'There was an error while saving.',
                        error: err
                    });
                });
            }

        };

        this.confirmRemoval = () => {
            showConfirm({
                title: 'Delete location',
                message: 'Are you sure? This cannot be undone.',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(function() {
                this.remove();
            }.bind(this));
        };

        this.remove = () => {
            serviceAddresses.delItem(this.jobTitleID(), this.addressID())
            .then(function() {
                this.wasRemoved(true);
                // Go out the deleted location
                app.shell.goBack();
            }.bind(this))
            .catch(function(err) {
                showError({
                    title: 'There was an error while deleting.',
                    error: err
                });
            });
        };

        /**
            Typed value binding rather than html binding allow to avoid
            problems because the data in html are string values while
            the actual data from the model is a number.
            Cause problems on some edge cases matching values and with
            detection of changes in the data (because the binding coming from the
            control assigning a string to the value).
        **/
        this.serviceRadiusOptions = ko.observableArray([
            { value: 0.5, label: '0.5 miles' },
            { value: 1.0, label: '1 mile' },
            { value: 2.0, label: '2 miles' },
            { value: 3.0, label: '3 miles' },
            { value: 4.0, label: '4 miles' },
            { value: 5.0, label: '5 miles' },
            { value: 10, label: '10 miles' },
            { value: 25, label: '25 miles' },
            { value: 50, label: '50 miles' },
            { value: 5000, label: 'I work remotely' },
        ]);

        // Special treatment of the save operation
        this.onSave = (addressID) => {
            if (this.requestData.returnNewAsSelected === true) {
                // Go to previous activity that required
                // to select an address
                // It's a new non-saved address
                if (this.clientUserID()) {
                    this.requestData.address = this.address().model.toPlainObject(true);
                }
                else {
                    this.requestData.addressID = addressID;
                }

                app.shell.goBack(this.requestData);
            }
            else if (onboarding.inProgress()) {
                // Per #712, we move to next onboarding step directly from editor
                // but implementation details at onboarding complicate this a bit,
                // so just go back and then move next
                app.shell.goBack();
                setTimeout(function() {
                    onboarding.goNext();
                }, 100);
            }
            else {
                app.successSave();
            }
        };
    }

    updateNavBarState() {
        var link = this.requestData.cancelLink || '/serviceAddresses/' + this.jobTitleID();
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }

    __connectJobTitle(jobTitleID) {
        this.listingTitle('Job Title');
        if (jobTitleID) {
            const listingDataProvider = getUserListing(jobTitleID);
            this.subscribeTo(listingDataProvider.onData, (listing) => {
                this.listingTitle(listing.title);
            });
            this.subscribeTo(listingDataProvider.onDataError, (error) => {
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
        }
    }

    __connectServiceAddress(jobTitleID, addressID, serviceType, clientUserID) {
        if (addressID) {
            // Get the address
            serviceAddresses.getItemVersion(jobTitleID, addressID)
            .then((addressVersion) => {
                if (addressVersion) {
                    this.addressVersion(addressVersion);

                    var address = addressVersion.original;
                    var title = (address.isServiceLocation() && address.kind() == Address.kind.service) ?
                        'Edit this place of work' :
                        'Edit this service area';
                    var formInstructions = (address.isServiceLocation() && address.kind() == Address.kind.service) ?
                        'This is an address of a location where clients come to receive your ' :
                        "This is an area where you are willing to go to a client's home or business to perform your ";

                    this.title(title);
                    this.formInstructions(formInstructions);
                }
                else {
                    this.addressVersion(null);
                    this.title('Unknown or deleted location');
                    this.formInstructions('');
                }

                this.postalCodeVM.onFormLoaded();
            })
            .catch((err) => {
                showError({
                    title: 'There was an error while loading.',
                    error: err
                });
            });
        }
        else {
            // New address
            this.addressVersion(serviceAddresses.newItemVersion({
                jobTitleID: jobTitleID
            }));

            this.formInstructions('');
            this.postalCodeVM.onFormLoaded();

            switch (serviceType) {
                case 'serviceArea':
                    this.address().isServiceArea(true);
                    this.address().isServiceLocation(false);
                    this.title('Add an area where you work');
                    this.titleIcon('ion-pinpoint');
                    this.formInstructions("Enter a zip code and a distance from that zip code to create an area where you are willing to go to a client's home or business to perform your ");
                    break;
                case 'serviceLocation':
                    this.address().isServiceArea(false);
                    this.address().isServiceLocation(true);
                    this.title('Add a place where you work');
                    this.titleIcon('ion-ios-location-outline');
                    this.formInstructions('Enter the address of the location where clients come to receive your ');
                    break;
                case 'clientLocation':
                    // A service professional is adding a location to perform a service that belongs
                    // to the client of the booking, on behalf of.
                    this.address().userID(clientUserID);
                    this.address().isServiceArea(false);
                    this.address().isServiceLocation(true);
                    this.title('Add a client location');
                    this.titleIcon('ion-ios-location-outline');
                    this.formInstructions("Enter your client's address where you'll perform your ");
                    break;
                default:
                    this.address().isServiceArea(true);
                    this.address().isServiceLocation(true);
                    this.title('Add a location for your ');
                    this.titleIcon('ion-ios-location-outline');
                    break;
            }
        }
    }

    /**
     * Routing params define the behavior, kind of address and owner of the
     * address to add or edit
     * @param {Object} state
     * @param {Object} state.route
     * @param {Object} state.route.segments List of parameters in URL with:
     * {string} kind at segments[0]
     * {(string|number)} jobTitleID at segments[1] if kind=service or 0
     * {(string|number)} addressID at segments[2] if kind=service or segments[1]
     * {string} serviceType at segments[2]
     * {(string|number)} clientUserID at segments[3] if serviceType=clientLocation
     */
    show(state) {
        super.show(state);

        // Params
        var params = state.route.segments || [];

        var kind = params[0] || '';
        var isService = kind === Address.kind.service;
        var jobTitleID = isService ? params[1] |0 : 0;
        var addressID = isService ? params[2] |0 : params[1] |0;
        // Only used on service address creation, instead an ID we get
        // a string for 'serviceArea' or 'serviceLocation')
        var serviceType = params[2] || '';
        // Special type: clientLocation
        var clientUserID = serviceType === 'clientLocation' ? params[3] : null;

        this.jobTitleID(jobTitleID);
        this.addressID(addressID);
        this.clientUserID(clientUserID);

        this.updateNavBarState();
        this.__connectJobTitle(jobTitleID);
        this.__connectServiceAddress(jobTitleID, addressID, serviceType, clientUserID);
    }
}

activities.register(ROUTE_NAME, AddressEditorActivity);
