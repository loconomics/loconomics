/**
 * ServiceProfessionalServices
 *
 * @module activities/service-professional-services
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import { Route, RouteMatcher } from '../../utils/Router';
import $ from 'jquery';
import Activity from '../../components/Activity';
import Client from '../../models/Client';
import ServiceProfessionalServiceViewModel from '../../viewmodels/ServiceProfessionalService';
import UserJobProfile from '../../viewmodels/UserJobProfile';
import UserType from '../../enums/UserType';
import clients from '../../data/clients';
import { item as getUserListing } from '../../data/userListings';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import serviceListGroupFactories from '../../viewmodels/ServiceListGroupFactories';
import serviceProfessionalServices from '../../data/serviceProfessionalServices';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'service-professional-services';
const DEFAULT_BACK_LINK = '/listing-editor';

export default class ServiceProfessionalServices extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // MIXIM with ServiceProfessionalServiceViewModel (it includes all its properties)
        // TODO: Refactor to not depend on mixims, expected to get to that by declouping
        // logic as components
        ServiceProfessionalServiceViewModel.call(this, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';
        this.navBar = Activity.createSubsectionNavBar('Job Title', {
            backLink: DEFAULT_BACK_LINK,
            helpLink: this.helpLink
        });
        // Save defaults to restore on updateNavBarState when needed:
        this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);
        this.title = ko.pureComputed(() => {
            if (this.isInOnboarding() && this.listingTitle()) {
                return 'Add your first ' + this.listingTitle() + ' offering';
            }
            else if (this.listingTitle() && !this.isSelectionMode()) {
                return this.listingTitle() + ' offerings';
            }
            else if (this.listingTitle() && this.isSelectionMode()) {
                return "What's included in " + this.clientName() + "'s " + this.listingTitle() + ' appointment?';
            }
            else {
                return 'Select a job title';
            }
        });

        this.__defViewMethods();
        this.__defViewProperties();
        this.__defHandlers();
    }

    __defViewProperties() {
        this.clientID = ko.observable(null);
        this.client = ko.observable(null);
        this.serviceEditorCancelLink = ko.observable(null);
        this.isInOnboarding = onboarding.inProgress;
        this.isLocked = this.isLoading;
        this.jobTitles = new UserJobProfile(this.app);
        this.jobTitles.baseUrl('/service-professional-services');
        this.clientName = ko.pureComputed(() => (this.client() && this.client().firstName()) || '');
        this.clientFullName = ko.pureComputed(() => (this.client() && this.client().fullName()) || '');
        this.clientManagerLink = ko.pureComputed(() => {
            if (this.client() || this.isSelectionMode() || onboarding.inProgress()) {
                return null;
            }
            else {
                return '#!/clients';
            }
        });
        this.listingTitle = ko.observable('Job Title');
        this.submitText = ko.pureComputed(() => this.isLoading() && 'loading...' || 'Save and continue');
        this.onboardingNextReady = ko.computed(() => {
            var isin = onboarding.inProgress();
            var hasPricing = this.list().length > 0;
            return isin && hasPricing;
        });
    }

    __defViewMethods() {
        // Go back with the selected pricing when triggered in the form/view
        this.returnSelected = (pricing, jobTitleID) => {
            // Pass the selected client in the info
            this.requestData.selectedServices = pricing;
            this.requestData.selectedJobTitleID = jobTitleID;
            // And go back
            shell.goBack(this.requestData);
        };
        this.returnRequest = () => {
            shell.goBack(this.requestData);
        };
        this.loadServicesData = () => {
            var clientID = this.clientID();
            var jobTitleID = this.jobTitleID();
            var services = null;
            if(this.isSelectionMode()) {
                services = serviceProfessionalServices.getServicesBookableByProvider(clientID, jobTitleID);
            }
            else if (clientID) {
                services = serviceProfessionalServices.getClientSpecificServicesForJobTitle(clientID, jobTitleID);
            }
            else {
                services = serviceProfessionalServices.getList(jobTitleID);
            }
            return this.loadData(null, jobTitleID, services);
        };
        this.serviceListGroupsFactory = (services, pricingTypes) => {
            var factories = serviceListGroupFactories;
            var listGroupsFactory = this.isSelectionMode() ?
                factories.providerBookedServices :
                factories.providerManagedServices;
            var isClientSpecific = !!this.clientID();
            services = this.isAdditionMode() ? [] : services;
            return listGroupsFactory(services, pricingTypes, this.clientName(), isClientSpecific);
        };
        this.editServiceRequest = () => $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData);
        this.newServiceRequest = () => $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData);
        // Replace and reuse method inherit from ServiceProfessionalService mixim
        // (cannot define as a method and use `super` since comes from mixim constructor)
        var baseNewServiceURL = this.newServiceURL.bind(this);
        this.newServiceURL = (jobTitleID, pricingTypeID, isClientSpecific) => {
            if(isClientSpecific) {
                return `#!serviceProfessionalServiceEditor/${jobTitleID}/pricingType/${pricingTypeID}/client/${this.clientID()}/new`;
            }
            else {
                return baseNewServiceURL(jobTitleID, pricingTypeID);
            }
        };
        /**
            Ends the selection process, ready to collect selection
            and passing it to the requester activity.
            Works too to pass to the next onboarding step
        **/
        this.endSelection = (data, event) => {
            if (onboarding.inProgress()) {
                // Ensure we keep the same jobTitleID in next steps as here:
                onboarding.selectedJobTitleID(this.jobTitleID());
                onboarding.goNext();
            }
            else {
                this.returnSelected(
                    this.selectedServices().map((pricing) => pricing.model.toPlainObject(true)),
                    this.jobTitleID()
                );
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        this.selectedServiceRequest = (pricing) => pricing.model.toPlainObject(true);
    }

    /**
     * TODO: Replace registerHandler calls with subscribeTo/observeChanges
     */
    __defHandlers() {
        this.registerHandler({
            target: this.clientID,
            handler: (clientID) => {
                this.client(null);
                if(clientID) {
                    clients
                    .item(clientID)
                    .onceLoaded()
                    .then((client) => {
                        this.client(new Client(client));
                    })
                    .catch((error) => {
                        showError({
                            title: 'Unable to load client.',
                            error
                        });
                    });
                }
            }
        });
        this.registerHandler({
            target: this.client,
            // Update navbar (may include the client name)
            handler: this.updateNavBarState.bind(this)
        });
    }

    applyOwnNavbarRules() {
        this.navBar.title(this.requestData.title || '');
        if (this.requestData.cancelLink) {
            this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink, this.requestData);
        }
        else {
            this.navBar.leftAction().model.updateWith(this.defaultLeftAction, true);
            this.navBar.leftAction().model.updateWith(this.newLeftAction(), true);
        }
    }

    newLeftAction() {
        var leftAction = {};
        var jid = this.jobTitleID();
        var url = this.mustReturnTo || (DEFAULT_BACK_LINK  + (jid ? '/' + jid : ''));
        var handler = this.isSelectionMode() ? this.returnRequest : null;

        leftAction.link = url;
        leftAction.text = this.leftActionText();
        leftAction.handler = handler;

        return leftAction;
    }

    leftActionText() {
        var clientName = this.client() && this.clientFullName();
        var jobTitle = this.listingTitle();

        return this.requestData.navTitle || clientName || jobTitle || 'Back';
    }

    updateNavBarState() {
        // Perform updates that apply this request:
        return onboarding.updateNavBar(this.navBar) || this.applyOwnNavbarRules();
    }

    referrerURL() {
        return (shell.referrerRoute && shell.referrerRoute.url) || '/';
    }

    serviceEditorCancelLink(isAdditionMode) {
        if (isAdditionMode) {
            // Sets referrer as cancel link
            return this.referrerURL();
        }
        else {
            return '/service-professional-services' + this.requestData.route.path;
        }
    }

    buildRoute(jobTitleID, clientID, isAdditionMode) {
        var base = '/service-professional-services';
        var jobTitle = '/' + jobTitleID;
        var client = clientID > 0 ? ('/client/' + clientID) : '';
        var newParam = isAdditionMode ? '/new' : '';

        return base + jobTitle + client + newParam;
    }

    parseRoute(url) {
        var paramsDefaults = { jobTitleID: 0, isNew: false, clientID: null };
        var matcher = new RouteMatcher([
            new Route('/:jobTitleID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID'),
            new Route('/new', { isNew: true }),
            new Route('/:jobTitleID')
        ], paramsDefaults);

        return matcher.match(url) || paramsDefaults;
    }

    useJobTitle(jobTitleID) {
        this.jobTitleID(jobTitleID);
        if (jobTitleID === 0) {
            this.clearData();
            this.jobTitles.sync();
        }
        else {
            // Load the data
            this.loadServicesData();
            // Load informational listing title
            const listingDataProvider = getUserListing(jobTitleID);
            this.subscribeTo(listingDataProvider.onData, (listing) => {
                this.listingTitle(listing.title);
                // Update navbar (may indicate the listing title)
                this.updateNavBarState();
                // May depend on current URL, will change with job title
                this.serviceEditorCancelLink(this.serviceEditorCancelLink(this.isAdditionMode()));
            });
            this.subscribeTo(listingDataProvider.onDataError, (error) => {
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
        }
    }

    show(state) {
        super.show(state);

        // Reset: avoiding errors because persisted data for different ID on loading
        // or outdated info forcing update
        this.reset();

        // Use data provided through state for internal communication between
        // activities (hidden state, not available at url/query).
        this.preSelectedServices(state.selectedServices || []);
        this.isSelectionMode(state.selectPricing === true);
        const selectedJobTitleID = state.selectedJobTitleID;

        // Query parameters
        // Remember route to go back, from a request of 'mustReturn' or last requested
        this.mustReturnTo = state.route.query.mustReturn || this.mustReturnTo;

        // URL segments parameters (path)
        const params = this.parseRoute(state.route.path);
        this.clientID(params.clientID | 0);
        // Choose job title from URL or fallback to selected in state
        let jobTitleID = params.jobTitleID | 0;
        if (jobTitleID === 0 && selectedJobTitleID > 0) {
            jobTitleID = selectedJobTitleID |0;
        }
        // Addition Mode
        const isAdditionMode = params.isNew;
        this.serviceEditorCancelLink(this.serviceEditorCancelLink(isAdditionMode));
        if (isAdditionMode) {
            state.cancelLink = this.referrerURL();
        }
        this.isAdditionMode(isAdditionMode);

        this.updateNavBarState();

        this.useJobTitle(jobTitleID);
    }
}

activities.register(ROUTE_NAME, ServiceProfessionalServices);
