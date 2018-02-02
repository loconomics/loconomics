/**
 * A list of suggested external platforms for a
 * professional to list themselves on based on their job
 * titles. It lists only platforms they don't already have
 * an external listing created.
 *
 * @module kocomponents/external-platform/suggestions-list
 *
 */
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import { list as platformsList } from '../../../data/platforms';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'external-platform-suggestions-list';

/**
 * Component
 */
export default class ExternalPlatformSuggestionsList extends Komponent {

    static get template() { return template; }

    constructor() {
        super();

        /**
         * An array of the platforms suggested.
         * @member {KnockoutObservable<Array<rest/Platform>>}
         */
        this.suggestedPlatforms = ko.observableArray();

        /**
         * Load the suggested platforms data.
         */
        this.subscribeTo(platformsList.onData, this.suggestedPlatforms);

        /**
         * Notify data load errors
         */
        this.subscribeTo(platformsList.onDataError, (err) => {
            showError({
              title: 'There was an error loading the platforms',
              error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, ExternalPlatformSuggestionsList);
