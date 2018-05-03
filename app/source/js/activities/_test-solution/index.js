/**
 * Testing activity around 'solution' components like solution-autocomplete.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import '../../kocomponents/listing/solutions-editor';
import * as activities from '../index';
import { bySearchSubcategoryID, item as solutionItem } from '../../data/solutions';
import { ActionForValue } from '../../kocomponents/solution/autocomplete';
import Activity from '../../components/Activity';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = '_test-solution';

export default class _TestSolutionActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing Solution';

        this.selectedSolution = ko.observable(null);
        this.isReloading = ko.observable(false);

        this.searchSubcategoryID = ko.observable(null);
        this.solutions = ko.observableArray([]);
    }

    __connectData() {
        let dataHandler = null;
        let errorHandler = null;
        this.observeChanges(() => {
            const catID = this.searchSubcategoryID();
            if (dataHandler) dataHandler.dispose();
            if (errorHandler) errorHandler.dispose();

            if (catID) {
                const cat = bySearchSubcategoryID(catID);
                dataHandler = this.subscribeTo(cat.onData, this.solutions);
                errorHandler = this.subscribeTo(cat.onDataError, (error) => {
                    showError({
                        title: 'An error happened',
                        error
                    });
                });
            }
        });
    }

    show(state) {
        super.show(state);

        this.__connectData();
    }

    /**
     * Provides a callback for the input-autocomplete onSelect parameter, that
     * provides the input text and solution object on user selection
     * @param {string} text
     * @param {rest/Solution} solution
     * @returns {kocomponents/input-autocomplete/ActionsAfterSelect} Clear the user
     * input once selected
     */
    selectSolution(text, solution) {
        this.selectedSolution(solution);
        return {
            value: ActionForValue.clear
        };
    }

    /**
     * Updates the data of the currently selected solution against the server.
     */
    refreshData() {
        if (this.isReloading() || !this.selectedSolution()) return;
        this.isReloading(true);
        solutionItem(this.selectedSolution().solutionID)
        .onceLoaded()
        .then(this.selectedSolution)
        .then(() => this.isReloading(false));
    }
}

activities.register(ROUTE_NAME, _TestSolutionActivity);
