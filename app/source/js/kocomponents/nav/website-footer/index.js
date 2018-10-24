/**
 * Static website footer with secondary navigation links and info.
 *
 * @module kocomponents/nav/website-footer
 */
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const TAG_NAME = 'nav-website-footer';

/**
 * Component
 */
export default class NavWebsiteFooter extends Komponent {

    static get style() { return style; }

    static get template() { return template; }

    static get cssClass() { return 'WebsiteFooter'; }

    constructor() {
        super();

        this.isApp = ko.pureComputed(() => !!window.cordova);
    }
}

ko.components.register(TAG_NAME, NavWebsiteFooter);
