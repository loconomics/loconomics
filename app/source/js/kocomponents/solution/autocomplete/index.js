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
import * as suggestedPlatformsList from '../../../data/suggestedPlatforms';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
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
         * List of platforms suggested.
         * @member {KnockoutComputed<Array<rest/Platform>>}
         */
        this.suggestedPlatforms = ko.observableArray();

        /**
         * Load suggestions.
         */
        this.subscribeTo(suggestedPlatformsList.onData, this.suggestedPlatforms);

        /// Notify data load errors
        const notifyError = (err) => {
            showError({
                title: 'There was an error loading the platforms',
                error: err
            });
        };
        this.subscribeTo(suggestedPlatformsList.onDataError, notifyError);
    }
}

ko.components.register(TAG_NAME, ExternalPlatformSuggestionsList);
