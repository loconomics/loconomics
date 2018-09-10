/**
 * ClientAppointment
 *
 * @module activities/client-appointment
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import EditClientBookingCardVM from '../../viewmodels/EditClientBookingCardVM';
import UserType from '../../enums/UserType';
import clientAppointments from '../../data/clientAppointments';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'client-appointment';

export default class ClientAppointment extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201983163-making-changes-canceling-appointments';
        this.navBar = Activity.createSubsectionNavBar('', {
            backLink: '/myAppointments',
            helpLink: this.helpLink
        });
        this.title('Your appointments');

        // View properties
        this.list = clientAppointments.list;
        this.currentIndex = ko.observable(-1);
        this.currentItem = new EditClientBookingCardVM(app);
        this.isLoading = ko.observable(false);
        this.returnText = ko.observable('Back');

        this.isEditButtonVisible = ko.pureComputed(function() {
            return (this.canCancel() || this.canEdit()) && !this.isEditMode() && !this.isCancelMode();
        }, this.currentItem);
        this.isCancelEditButtonVisible = ko.pureComputed(function() {
            return (this.canCancel() || this.canEdit()) && (this.isEditMode() || this.isCancelMode());
        }, this.currentItem);
        this.isEmpty = ko.pureComputed(() => this.currentIndex() === -2);

        this.__viewMethods();
    }

    __viewMethods() {
        var updateListIndex = () => {
            if (this.list().length) {
                if (this.currentIndex() === -1) {
                    // Single booking was selected, find in the list
                    var bID = this.currentItem.booking().bookingID();
                    this.list().some((b, i) => {
                        if (b.bookingID() === bID) {
                            this.currentIndex(i);
                            return true;
                        }
                    });
                }
            }
        };

        this.load = (id) => {
            if (id) {
                this.currentIndex(-1);
                this.currentItem.load(id)
                .then(function() {
                    // Load the list in background
                    clientAppointments.sync()
                    .then(updateListIndex);
                })
                .catch(function(err) {
                    showError({
                        title: 'Error loading the appointment',
                        error: err
                    });
                });
            }
            else {
                this.isLoading(true);
                this.currentItem.reset();
                clientAppointments.sync()
                .then(() => {
                    var first = this.list().length ? this.list()[0] : null;
                    if (first) {
                        this.currentIndex(0);
                        this.currentItem.load(first);
                        updateListIndex();
                        // Update URL
                        shell.replaceState(null, null, '/client-appointment/' + first.bookingID());
                    }
                    else {
                        this.currentIndex(-2);
                        // Update URL
                        shell.replaceState(null, null, '/client-appointment');
                    }
                    this.isLoading(false);
                })
                .catch((err) => {
                    this.isLoading(false);
                    showError({
                        title: 'Error loading appointments',
                        error: err
                    });
                });
            }
        };

        // Control list movements
        var goToIndex = (i) => {
            var min = 0;
            var max = this.list().length - 1;
            if (this.currentIndex() >= min) {
                var ni = Math.max(min, Math.min(max, i));
                this.currentIndex(ni);
                var b = this.list()[ni];
                this.currentItem.load(b);
                // Update URL
                shell.replaceState(null, null, '/client-appointment/' + b.bookingID());
            }
        };
        this.goNext = () => {
            goToIndex(this.currentIndex() + 1);
        };
        this.goPrevious = () => {
            goToIndex(this.currentIndex() - 1);
        };
    }

    show(state) {
        super.show(state);

        var params = state.route.segments;
        var id = params[0] |0;
        this.load(id);

        //Get the return nav text
        var returnText = state.route.query.returnText || 'Back';
        this.returnText(decodeURIComponent(returnText));
    }
}

activities.register(ROUTE_NAME, ClientAppointment);
