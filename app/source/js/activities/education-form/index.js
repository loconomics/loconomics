/**
 * EducationForm
 *
 * @module activities/education-form
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import education from '../../data/education';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'education-form';

export default class EducationForm extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201960833-adding-education-to-your-profile';
        this.navBar = Activity.createSubsectionNavBar('Education', {
            backLink: '/education',
            helpLink: this.helpLink
        });
        this.title = ko.pureComputed(() => {
            if (this.educationID() > 0) {
                return 'Edit training/education';
            }
            else {
                return 'Add training or education';
            }
        });

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.educationID = ko.observable(0);
        this.isLoading = education.state.isLoading;
        this.isSaving = education.state.isSaving;
        this.isSyncing = education.state.isSyncing;
        this.isDeleting = education.state.isDeleting;
        this.isLocked = ko.computed(() => this.isDeleting() || education.state.isLocked());

        this.version = ko.observable(null);
        this.item = ko.pureComputed(() => {
            var v = this.version();
            if (v) {
                return v.version;
            }
            return null;
        });

        this.isNew = ko.pureComputed(() => {
            var p = this.item();
            return p && !p.updatedDate();
        });

        this.submitText = ko.pureComputed(() => {
            var v = this.version();
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
            var v = this.version();
            return v && v.areDifferent();
        });

        this.deleteText = ko.pureComputed(() => {
            const label = this.isDeleting() ?
                'Deleting...' :
                'Delete';
            return label;
        });

        this.yearsOptions = ko.pureComputed(() => {
            var l = [];
            for (var i = new Date().getFullYear(); i > 1900; i--) {
                l.push(i);
            }
            return l;
        });
    }

    __defViewMethods() {
        this.save = () => {
            education.setItem(this.item().model.toPlainObject())
            .then(function(serverData) {
                // Update version with server data.
                this.item().model.updateWith(serverData);
                // Push version so it appears as saved
                this.version().push({ evenIfObsolete: true });
                // Go out
                this.app.successSave();
            }.bind(this))
            .catch(function(error) {
                showError({
                    title: 'There was an error while saving.',
                    error
                });
            });

        };

        this.confirmRemoval = () => {
            // L18N
            showConfirm({
                title: 'Delete',
                message: 'Are you sure? The operation cannot be undone.',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(() => this.remove());
        };

        this.remove = () => {
            education.delItem(this.educationID())
            .then(() => {
                // Go out
                // TODO: custom message??
                this.app.successSave();
            })
            .catch((error) => {
                showError({
                    title: 'There was an error while deleting.',
                    error
                });
            });
        };
    }

    updateNavBarState() {
        var link = this.requestData.cancelLink || '/education/';
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }

    show(state) {
        super.show(state);

        // Reset
        this.viewModel.version(null);

        // Params
        var params = state.route.segments || [];
        this.educationID(params[0] |0);

        this.updateNavBarState();

        if (this.educationID() === 0) {
            // NEW one
            this.version(education.newItem());
        }
        else {
            // LOAD
            education.createItemVersion(this.educationID())
            .then((educationVersion) => {
                if (educationVersion) {
                    this.version(educationVersion);
                } else {
                    throw new Error('No data');
                }
            })
            .catch((error) => {
                showError({
                    title: 'There was an error while loading.',
                    error
                })
                .then(() => {
                    // On close modal, go back
                    shell.goBack();
                });
            });
        }
    }
}

activities.register(ROUTE_NAME, EducationForm);
