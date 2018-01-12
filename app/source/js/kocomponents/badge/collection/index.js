/**
 * Displays collections of badges users have earned. Loconomics badges are currently issued through badgr.io
 * How it works:
 * The 'src' parameter is a URL that includes user-specific information
 * about a user's collection of badges.
 * @module kocomponents/badge-collection
 */
'use strict';

var getObservable = require('../../../utils/getObservable');

require('../view');

var TAG_NAME = 'badge-collection';
var template = require('./template.html');

var ko = require('knockout');

// const style = require('./style.styl');

function ViewModel(params) {
    const {src} = params;
    // Notes for Josh: equivalent to 'var src = params.src;'
    this.badges = getObservable([]);

    const headers = new Headers({
      'Accept': 'application/json'
    });

    fetch(src, {headers})
    .then((r) => {
      if(r.ok) {
        return r.json();
      }
    }).then((json) => {
      const badges = json.badges.map((b) => `${b.id}?v=2_0`);
      this.badges(badges);
    });
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
