/**
 * ServicesOverview
 *
 * @module activities/services-overview
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/servicesOverview/attributes-combobox';
import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import AttributesCategoryVM from '../../viewmodels/AttributesCategoryVM';
import UserJobProfile from '../../viewmodels/UserJobProfile';
import UserJobTitle from '../../models/UserJobTitle';
import UserType from '../../enums/UserType';
import jobTitleServiceAttributes from '../../data/jobTitleServiceAttributes';
import ko from 'knockout';
import serviceAttributes from '../../data/serviceAttributes';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';
import { item as userListingItem } from '../../data/userListings';

const ROUTE_NAME = 'services-overview';
const DEFAULT_BACK_LINK = '/listing-editor';
const DEFAULT_BACK_TEXT = 'Back';

export default class ServicesOverview extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967766-describing-your-services-to-clients';
        this.navBar = Activity.createSubsectionNavBar(DEFAULT_BACK_TEXT, {
            backLink: DEFAULT_BACK_LINK,
            helpLink: this.helpLink
        });
        this.title = 'Overview of your services';

        this.__defViewProperties();
    }

    __defViewProperties() {
        this.jobTitleID = ko.observable(0);
        this.isLoadingUserJobTitle = ko.observable(false);
        this.userJobTitle = ko.observable(null);
        this.listingTitle = ko.observable('Job Title');
        this.jobTitles = new UserJobProfile();
        this.jobTitles.baseUrl('/services-overview');
        // Local copy of the intro, rather than use
        // it directly from the userJobTitle to avoid that gets saved
        // in memory without press 'save'
        this.intro = ko.observable(null);
        this.serviceAttributesControl = serviceAttributes.newItemVersion();
        this.serviceAttributes = this.serviceAttributesControl.version;
        this.jobTitleServiceAttributesControl = jobTitleServiceAttributes.newItemVersion();
        this.jobTitleServiceAttributes = this.jobTitleServiceAttributesControl.original;
        this.isLoading = ko.pureComputed(() => this.isLoadingUserJobTitle() ||
            this.serviceAttributesControl.state.isLoading() ||
            this.jobTitleServiceAttributesControl.state.isLoading()
        );
        this.isSaving = ko.observable(false);
        this.isLocked = ko.pureComputed(() => this.isLoading() || this.isSaving());
        // Combined array of service attribute categories for all the available and
        // information for the selected by the user, with methods modify and query the lists
        this.categoriesView = ko.pureComputed(() => {
            var userAtts = this.serviceAttributes;
            return this.jobTitleServiceAttributes.serviceAttributes().map((cat) => new AttributesCategoryVM(cat, userAtts));
        });
        this.submitText = ko.pureComputed(() => {
            const t = this.isLoading() ?
                'loading...' :
                this.isSaving() ?
                'saving...' :
                'Save';
            return t;
        });
    }

    updateNavBarState() {
        // Must mustReturn logic takes precendence
        // NOTE: is applied globally by app.js too, but async task may
        // end replacing it:
        var done = this.app.applyNavbarMustReturn(this.requestData);
        if (!done) {
            var text = this.listingTitle() || DEFAULT_BACK_TEXT;
            var id = this.jobTitleID();
            var link = id ? DEFAULT_BACK_LINK + '/' + id : DEFAULT_BACK_LINK;
            // Use job title name and ID for back link
            this.navBar.leftAction().model.updateWith({
                text: text,
                link: link
            });
        }
    }

    useJobTitle(jobTitleID) {
        this.jobTitleID(jobTitleID);
        if (jobTitleID) {
            // Listing with user data
            this.isLoadingUserJobTitle(true);
            userListingItem(jobTitleID).onceLoaded()
            .then((listing) => {
                // Direct copy of listing values
                this.listingTitle(listing.title);
                // local copy of intro
                this.intro(listing.intro);
                this.isLoadingUserJobTitle(false);
                // Save for use in the view
                this.userJobTitle(new UserJobTitle(listing));
                this.isLoadingUserJobTitle(false);
                // nav bar depends on listingTitle
                this.updateNavBarState();
            })
            .catch((error) => {
                this.isLoadingUserJobTitle(false);
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
            // Additional data, available to be chosen/selected
            Promise.all([
                this.serviceAttributesControl.load(jobTitleID),
                this.jobTitleServiceAttributesControl.load(jobTitleID)
            ])
            .catch((error) => {
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
        }
        else {
            this.serviceAttributesControl.reset();
            this.jobTitleServiceAttributesControl.reset();
        }
    }

    show(state) {
        super.show(state);

        // Reset
        this.intro(null);
        this.serviceAttributes.proposedServiceAttributes({});
        this.listingTitle('Job Title');
        // nav bar depends on listingTitle
        this.updateNavBarState();

        const params = state.route.segments;
        const jobTitleID = params[0] |0;

        this.useJobTitle(jobTitleID);
    }

    save() {
        var ujt = this.userJobTitle();
        if (ujt) {
            this.isSaving(true);
            var plain = ujt.model.toPlainObject();
            plain.intro = this.intro();

            Promise.all([
                this.serviceAttributesControl.save(),
                userListingItem(this.jobTitleID()).save(plain)
            ])
            .then(() => {
                this.isSaving(false);
                // Force a background jobTitleAttributes refresh if new ones
                // where submitted for insertion.
                var props = this.serviceAttributes.proposedServiceAttributes();
                var propCats = props && Object.keys(props);
                if (propCats && propCats.length) {
                    var thereAreNews = propCats.reduce(function(sum, k) {
                        var cat = props[k];
                        return sum + (cat && cat.length || 0);
                    }, 0) > 0;
                    if (thereAreNews) {
                        this.jobTitleServiceAttributesControl.load(undefined, true);
                    }
                }
                // Cleanup
                this.serviceAttributes.proposedServiceAttributes({});
                this.app.successSave();
            })
            .catch((error) => {
                this.isSaving(false);
                showError({ title: 'Error saving your Services Overview', error });
            });
        }
    }
}

activities.register(ROUTE_NAME, ServicesOverview);
