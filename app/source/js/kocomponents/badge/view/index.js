/**
 * Displays badges users have earned. Loconomics badges are currently issued through badgr.io
 * How it works:
 * The 'src' parameter is a URL that includes user-specific information
 * about a user's single badge including:
 * - 'image' of the badge
 * - 'evidence' (optional)
 * - 'narrative' 
 * - the 'badge' URL pointing to the general info about the badge
 * The 'badge' contains the following information:
 * - 'name' of the badge
 * - 'narrative' of the badge which is a description
 *
 * You can also pass this information directly into the 'assertion' parameter if you already have it locally.
 * 
 * To populate this information and display in the component:
 * - we fetch the 'assertion' json object 
 * - we amend the 'badge' url to point it to the json url
 * - we fetch the amended 'badge' json object
 * - we populate the properties
 * @module kocomponents/badge-view
 */
'use strict';

var getObservable = require('../../../utils/getObservable');

var TAG_NAME = 'badge-view';
var template = require('./template.html');

var ko = require('knockout');

// const style = require('./style.styl');

function ViewModel(params) {
    const {src} = params;
    // Notes for Josh: equivalent to 'var src = params.src;'
    this.assertion = getObservable(params.assertion);
    this.image = getObservable('');
    this.narrative = getObservable('');
    this.evidence = getObservable('');
    this.badgeName = getObservable('');
    this.badgeDescription = getObservable('');
//    this.style = style;

    const populateObservables = (payload) => {
      this.image(payload.image);
      this.narrative(payload.narrative);
      if (payload.evidence.length > 0) {
        this.evidence(payload.evidence[0].id);
      }
      const badge = payload.badge.slice(0,-6) + '.json?v=2_0';
      fetch(badge)
      .then((r) => {
        if(r.ok)
          return r.json();
      }).then((json) => {
        this.badgeName(json.name);
        this.badgeDescription(json.description);
      });
    };

    if(src) {
      fetch(src)
      .then((r) => {
        if(r.ok)
          return r.json();
      }).then((json) => populateObservables(json));
    } else {
      populateObservables(this.assertion());
    }
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
