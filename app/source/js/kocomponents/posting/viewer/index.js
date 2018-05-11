/**
 * Used to view the details of a posting, with optional client info (to show
 * a suggested posting to professionals).
 * It's a template-only (stateless/dummy) component.
 *
 * @module kocomponents/posting/suggested
 *
 * @param {object} params
 * @param {(models/UserPosting|KnockoutObservable<models/UserPosting>)} params.data
 */
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'posting-viewer';

ko.components.register(TAG_NAME, {
    template: template
});
