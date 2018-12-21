/**
 * ServiceProfessionalServiceEditor
 *
 * @module activities/service-professional-service-editor
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 *
 * TODO: ModelVersion is NOT being used, so no getting updates if server updates
 * the data after load (data load is requested but get first from cache). Use
 * version and get sync'ed data when ready, and additionally notification to
 * override changes if server data is different that any local change.
 */

import * as activities from '../index';
import * as clients from '../../data/clients';
import { Route, RouteMatcher } from '../../utils/Router';
import Activity from '../../components/Activity';
import Client from '../../models/Client';
import PricingType from '../../models/PricingType';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import pricingTypes from '../../data/pricingTypes';
import serviceProfessionalServices from '../../data/serviceProfessionalServices';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'service-professional-service-editor';

export default class ServiceProfessionalServiceEditor extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';
        this.navBar = Activity.createSubsectionNavBar('Services', {
            helpLink: this.elpLink
        });
        this.title = ko.pureComputed(() => {
            var pricingName = (this.pricingType() && this.pricingType().singularName()) || 'Service';
            var prefix = this.isNew() ? 'New ' : '';
            var postfix = this.client() ? (' only for ' + this.client().firstName()) : '';

            if (this.isLoading()) {
                return 'Loading...';
            }
            else if (this.serviceProfessionalServiceVersion()) {
                return prefix + pricingName + postfix;
            }
            else {
                return 'Unable to load service';
            }
        });

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        this.isLoading = ko.observable(false);
        // managed manually instead of
        //serviceProfessionalServices.state.isLoading;
        this.isSaving = serviceProfessionalServices.state.isSaving;
        this.isSyncing = serviceProfessionalServices.state.isSyncing;
        this.isDeleting = serviceProfessionalServices.state.isDeleting;
        this.jobTitleID = ko.observable(0);
        this.serviceProfessionalServiceID = ko.observable(0);
        // L10N
        this.moneySymbol = ko.observable('$');
        this.pricingType = ko.observable(new PricingType());
        this.serviceProfessionalServiceVersion = ko.observable(null);
        this.serviceProfessionalService = ko.pureComputed(() => {
            var v = this.serviceProfessionalServiceVersion();
            if (v) {
                return v.version;
            }
            return null;
        });
        this.client = ko.observable(null);
        // Quicker access in form, under a 'with'
        this.current = ko.pureComputed(() => {
            var t = this.pricingType();
            var p = this.serviceProfessionalService();
            if (t && p) {
                return {
                    type: t,
                    pricing: p
                };
            }
            return null;
        });
        this.showFirstTimeClientsOnlyLabel = ko.pureComputed(() => {
            var pricingLabel = this.pricingType() && this.pricingType().firstTimeClientsOnlyLabel();
            return pricingLabel && !this.client();
        });
        this.wasRemoved = ko.observable(false);
        this.isLocked = ko.computed(() => this.isDeleting() || serviceProfessionalServices.state.isLocked());
        this.isNew = ko.pureComputed(() => {
            var p = this.serviceProfessionalService();
            return p && !p.updatedDate();
        });
        this.submitText = ko.pureComputed(() => {
            var v = this.serviceProfessionalServiceVersion();
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
            var v = this.serviceProfessionalServiceVersion();
            return v && v.areDifferent();
        });
        this.deleteText = ko.pureComputed(() => this.isDeleting() && 'Deleting...' || 'Delete');
    }

    __defViewMethods() {
        /// Go out after save succesfully an item.
        /// Pricing is a plain object
        const onSave = (pricing) => {
            // Go back on save.
            // If we comes with a selection of pricing, we must add the new one
            // there and just go back (serviceProfessionalService is in selection mode) keeping
            // any requestData for in-progress state.
            if (this.requestData.selectedServices) {
                // Is an array of plain objects of just ID and totalPrice
                this.requestData.selectedServices.push({
                    serviceProfessionalServiceID: pricing.serviceProfessionalServiceID,
                    totalPrice: pricing.totalPrice
                });
                shell.goBack(this.requestData);
            }
            else if (onboarding.inProgress()) {
                shell.goBack();
            }
            else {
                this.app.successSave();
            }
        };
        this.save = () => {
            serviceProfessionalServices
            .setItem(this.serviceProfessionalService().model.toPlainObject())
            .then((serverData) => {
                // Update version with server data.
                this.serviceProfessionalService().model.updateWith(serverData);
                // Push version so it appears as saved
                this.serviceProfessionalServiceVersion().push({ evenIfObsolete: true });
                onSave(serverData);
            })
            .catch((error) => {
                showError({
                    title: 'Unable to save the service.',
                    error
                });
            });
        };
        this.confirmRemoval = () => {
            // TODO Better l10n or replace by a new preset field on pricingType.deleteLabel
            var p = this.pricingType();
            showConfirm({
                title: 'Delete ' + (p && p.singularName()),
                message: 'Are you sure? The operation cannot be undone.',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(() => this.remove());
        };
        this.remove = function() {
            serviceProfessionalServices
            .delItem(this.jobTitleID(), this.serviceProfessionalServiceID())
            .then(() => {
                this.wasRemoved(true);
                // Go out the deleted location
                shell.goBack();
            })
            .catch((error) => {
                showError({
                    title: 'Unable to delete the service.',
                    error
                });
            });
        };
    }

    updateNavBarState() {
        var link = this.requestData.cancelLink || '/service-professional-services/' + this.jobTitleID();
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }

    /**
     * The pricing record needs some special set-up after creation/loading and before
     * being presented to the user, because special value-rules.
     */
    pricingSetup() {
        // Pricing fields that has a special initial value
        var c = this.current();
        if (c) {
            // Name: must be the PricingType.fixedName ever if any, or
            //   the name saved in the pricing or
            //   the suggestedName as last fallback
            c.pricing.name(c.type.fixedName() || c.pricing.name() || c.type.suggestedName());
            // Required call after loading a pricing to reflect data correctly (cannot be automated)
            c.pricing.refreshNoPriceRate();
        }
    }

    showLoadingError(error) {
        this.isLoading(false);
        showError({
            title: 'Unable to load service',
            error: error
        })
        .then(() => {
            // On close modal, go back
            shell.goBack();
        });
    }

    loadClientOfService(service) {
        var clientID = service.clientID();

        if(clientID) {
            return clients
            .item(clientID)
            .onceLoaded()
            .then((client) => {
                this.client(new Client(client));
            })
            .catch((error) => {
                showError({ title: 'Unable to load client.', error });
            });
        }
        else {
            this.client(null);
            return Promise.resolve(service);
        }
    }

    loadData(pricingTypeID, jobTitleID, clientID, serviceProfessionalServiceID) {
        this.isLoading(true);
        if (pricingTypeID) {
            // Load the pricing Type
            pricingTypes
            .getItem(pricingTypeID)
            .then((type) => {
                this.pricingType(type);
                // New pricing
                var serviceVersion = serviceProfessionalServices.newItemVersion({
                    jobTitleID: jobTitleID,
                    pricingTypeID: pricingTypeID,
                    visibleToClientID: clientID
                });
                this.serviceProfessionalServiceVersion(serviceVersion);
                this.pricingSetup();
                return serviceVersion.version;
            })
            .then((service) => this.loadClientOfService(service))
            .catch((error) => this.showLoadingError(error))
            // finally:
            .then(() => {
                this.isLoading(false);
            });
        }
        else if (serviceProfessionalServiceID) {
            // Get the pricing
            serviceProfessionalServices
            .getItemVersion(jobTitleID, serviceProfessionalServiceID)
            .then((serviceProfessionalServiceVersion) => {
                if (!serviceProfessionalServiceVersion) {
                    throw new Error('Unable to load service');
                }
                // Load the pricing type before put the version
                const typeID = serviceProfessionalServiceVersion.version.pricingTypeID();
                return pricingTypes.getItem(typeID)
                .then((type) => {
                    this.pricingType(type);
                    this.serviceProfessionalServiceVersion(serviceProfessionalServiceVersion);
                    this.pricingSetup();
                    return serviceProfessionalServiceVersion.version;
                });
            })
            .then((service) => this.loadClientOfService(service))
            .catch((error) => this.showLoadingError(error))
            .then(function() {
                this.viewModel.isLoading(false);
            }.bind(this));
        }
        else {
            this.showLoadingError('Unable to load service — missing parameters');
        }
    }

    show(state) {
        super.show(state);

        // Reset
        this.wasRemoved(false);
        this.serviceProfessionalServiceVersion(null);
        this.pricingType(null);

        // Params
        var paramsDefaults = { jobTitleID: 0, serviceID: 0, pricingTypeID: 0, clientID: 0 };
        var matcher = new RouteMatcher([
            new Route('/:jobTitleID/pricingType/:pricingTypeID/client/:clientID/new'),
            new Route('/:jobTitleID/pricingType/:pricingTypeID/new'),
            new Route('/:jobTitleID/:serviceID')
        ], paramsDefaults);

        var params = matcher.match(state.route.path) || {};

        var jobTitleID = params.jobTitleID | 0;
        var pricingTypeID = params.pricingTypeID | 0;
        var serviceProfessionalServiceID = params.serviceID | 0;
        var clientID = params.clientID | 0;

        this.jobTitleID(jobTitleID);
        this.serviceProfessionalServiceID(serviceProfessionalServiceID);

        this.updateNavBarState();
        this.loadData(pricingTypeID, jobTitleID, clientID, serviceProfessionalServiceID);
    }
}

activities.register(ROUTE_NAME, ServiceProfessionalServiceEditor);
