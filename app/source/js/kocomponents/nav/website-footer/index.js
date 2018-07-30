/**
 * Static website footer with secondary navigation links and info.
 *
 * @module kocomponents/nav/website-footer
 */
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'nav-website-footer';

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: {
        instance: {
            isApp: ko.pureComputed(() => !!window.cordova)
        }
    }
});
