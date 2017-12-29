/**
 * Displays badges users have earned. Loconomics badges are currently issued through badgr.io
 * @module kocomponents/badge-view
 */
'use strict';

var getObservable = require('../../../utils/getObservable');

var TAG_NAME = 'badge-view';
var template = require('./template.html');

var ko = require('knockout');
//var showError = require('../../../modals/error').show;

function ViewModel(params) {
    const {src} = params;
    this.image = getObservable('');
    this.narrative = getObservable('');

    fetch(src)
    .then((r) => {
      if(r.ok)
        return r.json();
    }).then((json) => {
      this.image(json.image);
      this.narrative(json.narrative);
    });
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
