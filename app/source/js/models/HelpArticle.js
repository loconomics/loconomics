/** HelpArticle model.
 **/
'use strict';

var Model = require('./Model');
var ko = require('knockout');
var slug = require('../utils/slug');

function HelpArticle(values) {

    Model(this);

    this.model.defProperties({
        id: 0,
        section_id: 0,
        title: '',
        // Same property name as in source Zendesk API but later an alias..
        body: '',
    }, values);
    
    // Alias for body, keeping the same property name as other Help* classes.
    this.description = this.body;
    
    this.tail = ko.pureComputed(function() {
        return this.id() + '-' + slug(this.title());
    }, this);
    
    this.urlPath = ko.pureComputed(function() {
        return '/help/articles/' + this.tail();
    }, this);
}

module.exports = HelpArticle;
