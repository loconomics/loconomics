/**
 * Used to view the details of a suggested posting (to professionals).
 *
 * @module kocomponents/posting/suggested
 *
 * @param {object} params
 * @param {(models/UserPosting|KnockoutObservable<models/UserPosting>)} params.data
 */
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'posting-suggested';

ko.components.register(TAG_NAME, {
    template: template
});
