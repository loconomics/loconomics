/**
 * A list of search solutions mapped to job titles.
 *
 * @module kocomponents/search/solution/viewer
 *
 */ 
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import { list as solutionsList } from '../../../data/solutions';
import template from './template.html';

const TAG_NAME = 'solution-viewer';

/**
 * Component
 */
export default class SolutionViewer extends Komponent {

    static get template() { return template; }

    constructor() {
        super();

        /**
         * An array containing the external listings for the
         * speciic user.
         * @member {KnockoutObservable<array>}
         */
        this.solutionsList = ko.observableArray();


        /**
         * Suscribe to data coming for the list and put them in our
         * searchCategory property.
         */
        this.subscribeTo(solutionsList.onData, this.solutionsList);

        /**
         * Notify data load errors
         */
        this.subscribeTo(solutionsList.onDataError, (err) => {
            showError({
                title: 'There was an error loading solutions',
                error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, SolutionViewer);
