/**
    Blog activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');

var A = Activity.extend(function HelpActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    this.accessLevel = null;    
    this.navBar = Activity.createSectionNavBar('Blog');
    this.title('Loconomics blog');
    
    // TestingData
    //setSomeTestingData(this.viewModel);
    this.currentLabels = '';
    this.loadPosts = function() {
        // don't load if blog is already loaded
        if(this.viewModel.blog().length>0){
            return ;
        }
        var url = 'https://public-api.wordpress.com/rest/v1.1/sites/loconomics.wordpress.com/posts/' + encodeURIComponent(this.currentLabels);
        this.viewModel.isLoading(true);
        
        var $ = require('jquery');
        Promise.resolve($.get(url)).then(function(resPosts) {
            if (resPosts) {
                this.viewModel.blog(resPosts.posts.map(function(post) {
                        var tail = post.ID + '-' + slug(post.title);
                    return new Post({
                        id: post.ID,
                        date: post.date,
                        title: post.title,
                        author: post.author.first_name + '' + post.author.last_name,
                        content: post.content,
                        excerpt: post.excerpt,
                        tags: post.tags,
                        tail: tail,
                        urlPath: '/blog/posts/' + tail
                    });
                }));
            }
            else {
                this.viewModel.blog([]);
            }
            this.viewModel.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.viewModel.isLoading(false);
        }.bind(this));
    }.bind(this);

    this.subSectionFunction = {
        "posts": function(tailId){
            this.viewModel.selectedPostId(parseInt(tailId, 10));
            this.viewModel.viewType('postView');
        }.bind(this),
    };

    this.renderSubSection = function(subSectionPath, tail){
        var tailId = tail.split('-')[0];
        if(tailId === ''){
            // for postView
            if(subSectionPath ==="posts"){
                this.viewModel.viewType('postView');
            }
            // for articleView and blogView
            else{
                this.viewModel.viewType('blogView');
            }
        }
        else{
            this.subSectionFunction[subSectionPath](tailId);
        }
    };
});

exports.init = A.init;

A.prototype.show = function show(state) {
    
    Activity.prototype.show.call(this, state);
    
    this.viewModel.searchText('');
    this.loadPosts();

    var params = state && state.route && state.route.segments;

    var subSections = ['posts'];
    this.viewModel.viewType('');
    if(params){
        var subSectionPath = params[0] || '';
        var tail = params[1] || '';

        if(subSections.indexOf(subSectionPath)>-1){
            this.renderSubSection(subSectionPath, tail);
        }
        else if( subSectionPath === ''){
            this.viewModel.viewType('blogView');
        }
        else{
            this.viewModel.viewType('404');
        }
    }
};
var ko = require('knockout');

function ViewModel() {
    
    this.blog = ko.observableArray([]);
    this.searchText = ko.observable('');
    this.searchDate = ko.observable('');
    this.searchTags = ko.observable('');
    this.isLoading = ko.observable(false);
    this.params = ko.observable(''); // sections/2342342342-stuff-i-do
    this.viewType = ko.observable('');

    this.tailId = ko.observable('');

    this.selectedPostId = ko.observable(0);

    this.fullPostData = ko.pureComputed(function() {
        var selectedPostId = this.selectedPostId();
        var result = this.blog().filter(function(post) {
            var postIsSelected = post.id() === selectedPostId;
            return postIsSelected;
        });
        return result.length ? result[0]:null;
    }, this);
    
    this.filteredPostsBySearch = ko.pureComputed(function() {
        var s = this.searchText().toLowerCase();
        return this.blog().filter(function(v) {
            var n = v && v.title() || '';
            n += v && v.content() || '';
            n += v && v.date() || '';
            n += v && v.tags() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);
    
    this.filteredPostsByDate = ko.pureComputed(function() {
        var s = this.searchDate();
        return this.blog().filter(function(v) {
            var n = v && v.date() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);
    
    this.filteredPostsByTags = ko.pureComputed(function() {
        var s = this.searchTags().toLowerCase();
        return this.blog().filter(function(v) {
            var n = v && v.tags() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);

    this.nothingFound = ko.pureComputed(function(){
        // if any of the below arguments are true
        // then "Nothing is found."
        return (
            !this.filteredPostsBySearch().length +
            (this.viewType() == 'blogView' && !this.filteredPostsBySearch().length)
        );
    }, this);
}

var Model = require('../models/Model');
function Post(values) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        date: '',
        title: '',
        author: '',
        content: '',
        excerpt: '',
        tags: '',
        tail: '',
        urlPath: ''
    }, values);
}

/*
from: http://stackoverflow.com/questions/1053902/how-to-convert-a-title-to-a-url-slug-in-jquery
Author: Taranttini
Author's Stack Overflow Profile: http://stackoverflow.com/users/693547/taranttini
*/
function slug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;'";
  var to   = "aaaaaeeeeeiiiiooooouuuunc-------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}
