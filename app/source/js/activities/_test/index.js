/**
 * Testing activity '_test'. Do temporary trials here but without commit them,
 * or do it copying with another name (keep the leading underscore if is
 * just for testing).
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import * as activities from '../index';
import * as data from '../../data/helpers/trialCachedDataProvider';
import Activity from '../../components/Activity';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = '_test';

export default class _TestActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing area';
        this.single = ko.observable();

        // const loadSingle = () => {
        //     data.apiSingle.onceLoaded().then((data) => this.single(data) && console.log('single data', data));
        // };
        // // Immediate, expected no cache
        // loadSingle();
        // // 6s delay, from cache (single has 1 minute ttl)
        // setTimeout(loadSingle, 6000);

        let times = 1;
        data.apiItem.onData.subscribe((data) => console.log('item data', times++, data));
        const loadItem = () => {
            data.apiItem.__sync();
        };
        // Immediate, expected no cache
        loadItem();
        // 6s delay, from cache (has 1 minute ttl)
        setTimeout(loadItem, 6000);

        data.apiList.onceLoaded().then((data) => console.log('list data', data));
    }
}

activities.register(ROUTE_NAME, _TestActivity);
