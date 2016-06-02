/**
    Help activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function HelpActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    this.accessLevel = null;    

    this.navBar = Activity.createSubsectionNavBar('Back');

    // TestingData
    //setSomeTestingData(this.viewModel);
    this.currentLabels = '';
    this.loadArticles = function() {
        // don't load if faqs and sections are already loaded
        if(this.viewModel.articles().length>0 && this.viewModel.sections().length>0){
            return ;
        }

        // var articleIdsRelatedTo = {'weeklySchedule':[205679005, 205282499]};
        var url = 'https://loconomics.zendesk.com/api/v2/help_center/articles.json?label_names=' + encodeURIComponent(this.currentLabels);
        var categoriesUrl = 'https://loconomics.zendesk.com/api/v2/help_center/categories.json';
        var sectionsUrl = 'https://loconomics.zendesk.com/api/v2/help_center/sections.json';
        this.viewModel.isLoading(true);

        var $ = require('jquery');
        Promise.all([$.get(url), $.get(categoriesUrl), $.get(sectionsUrl)]).then(function(res) {
            var resArticles = res[0];
            var resCategories = res[1];
            var resSections = res[2];

            if(resCategories){
                this.viewModel.categories(
                    resCategories.categories.map(function(category){
                        var tail = category.id + '-' + slug(category.name);
                        return new Category({
                            id: category.id,
                            category_id: category.category_id,
                            name: category.name,
                            description: category.description,
                            tail: tail,
                            urlPath: '/help/categories/' + tail
                        });
                    })
                );
            }
            else {
                this.viewModel.categories([]);
            }

            if(resSections){
                this.viewModel.sections(
                    resSections.sections.map(function(section){
                        var tail = section.id + '-' + slug(section.name);
                        return new Section({
                            id: section.id,
                            category_id: section.category_id,
                            name: section.name,
                            description: section.description,
                            tail: tail,
                            urlPath: '/help/sections/' + tail
                        });
                    })
                );
                // need to "call" every property in order to get value
                // exmaple:
                // console.log(this.viewModel.sections()[0].name()); >> "Announcements"
            }
            else {
                this.viewModel.sections([]);
            }

            if (resArticles) {
                this.viewModel.articles(resArticles.articles.map(function(art) {
                    var tail = art.id + '-' + slug(art.title);
                    return new Article({
                        id: art.id,
                        section_id : art.section_id,
                        title: art.title,
                        description: art.body,
                        tail: tail,
                        urlPath: '/help/articles/' + tail
                    });
                }));
            }
            else {
                this.viewModel.articles([]);
            }
            this.viewModel.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.viewModel.isLoading(false);
        }.bind(this));
    }.bind(this);


    this.subSectionFunction = {
        "categories": function(tailId){
            this.viewModel.selectedCategoryId(parseInt(tailId, 10));
            this.viewModel.viewType('categoryView');
        }.bind(this),
        "sections": function(tailId){
            this.viewModel.selectedSectionId(parseInt(tailId, 10));
            this.viewModel.viewType('sectionView');
        }.bind(this),
        "articles": function(tailId){
            this.viewModel.selectedArticleId(parseInt(tailId, 10));
            this.viewModel.viewType('articleView');
        }.bind(this),
        "relatedArticles": function(tailId){
            this.viewModel.selectedSectionId(parseInt(tailId, 10));
            this.viewModel.viewType('helpView');
        }.bind(this),
    };

    this.renderSubSection = function(subSectionPath, tail){
        var tailId = tail.split('-')[0];
        if(tailId === ''){
            // for categoryView
            if(subSectionPath ==="categories"){
                this.viewModel.viewType('viewAllCategories');
            }
            // for sectionView
            if(subSectionPath ==="sections"){
                this.viewModel.viewType('viewAllSections');
            }
            // for sectionView
            if(subSectionPath ==="articles"){
                this.viewModel.viewType('articleView');
            }
            // for sectionView
            if(subSectionPath ==="relatedArticles"){
                this.viewModel.viewType('helpView');
            }
            // for articleView and helpView
            else{
                this.viewModel.viewType('viewAllArticles');
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

    this.loadArticles();

    var params = state && state.route && state.route.segments;

    var subSections = ['articles', 'sections', 'categories', 'relatedArticles'];
    this.viewModel.viewType('');
    if(params){
        var subSectionPath = params[0] || '';
        var tail = params[1] || '';

        if(subSections.indexOf(subSectionPath)>-1){
            this.renderSubSection(subSectionPath, tail);
        }
        else if( subSectionPath === ''){
            this.viewModel.viewType('viewAllCategories');
        }
        else{
            this.viewModel.viewType('404');
        }
    }
};

var ko = require('knockout');

function ViewModel() {


    this.articles = ko.observableArray([]);
    this.searchText = ko.observable('');
    this.isLoading = ko.observable(false);
    this.params = ko.observable(''); // sections/2342342342-stuff-i-do
    this.viewType = ko.observable(''); 
    
    this.tailId = ko.observable('');

    this.categories = ko.observableArray([]);

    this.sections = ko.observableArray([]);

    this.selectedArticleId = ko.observable(0);

    this.selectedCategoryId = ko.observable(0);

    this.selectedSectionId = ko.observable(0);

    this.fullArticleData = ko.pureComputed(function() {
        var selectedArticleId = this.selectedArticleId();
         var result = this.articles().filter(function(article) {
            var articleIsSelected = article.id() === selectedArticleId;
            return articleIsSelected;
        });
        return result.length ? result[0]:null;
    }, this);

    this.selectedSection = ko.pureComputed(function(){
        var selectedSectionId = this.selectedSectionId();
         var result = this.sections().filter(function(section) {
            var sectionIsSelected = section.id() === selectedSectionId;
            return sectionIsSelected;
        });
        return result.length ? result[0]:null;
    }, this);

    this.selectedCategory = ko.pureComputed(function(){
        var selectedCategoryId = this.selectedCategoryId();
         var result = this.categories().filter(function(category) {
            var categoryIsSelected = category.id() === selectedCategoryId;
            return categoryIsSelected;
        });
        return result.length ? result[0]:null;
    }, this);

    this.filteredSectionArticles = ko.pureComputed(function() {
        var selectedSectionId = this.selectedSectionId();
         var result = this.articles().filter(function(article) {
            var articleIsSelected = article.section_id() === selectedSectionId;
            return articleIsSelected;
        });
        return result.length ? result:null;
    }, this);

    this.filteredCategorySections = ko.pureComputed(function() {
        var selectedCategoryId = this.selectedCategoryId();
         var result = this.sections().filter(function(section) {
            var sectionIsSelected = section.category_id() === selectedCategoryId;
            return sectionIsSelected;
        });
        return result.length ? result:null;
        
    }, this);

    this.filteredArticles = ko.pureComputed(function() {
        var s = this.searchText().toLowerCase();
         var result = this.articles().filter(function(v) {
            var n = v && v.title() || '';
            n += v && v.description() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
        return result.length ? result:null;
    }, this);

    this.nothingFound = ko.pureComputed(function(){
        // if any of the below arguments are true
        // then "Nothing is found."
        return (
            this.filteredArticles() === null +
            (this.viewType() == '404') +
            (this.viewType() == 'viewAllSections' && this.sections() === null) +
            (this.viewType() == 'categoryView' && this.filteredCategorySections() === null) +
            (this.viewType() == 'sectionView' && this.filteredSectionArticles() === null) +
            (this.viewType() == 'viewAllArticles' && this.articles() === null) +
            (this.viewType() == 'articleView' && this.fullArticleData() === null) +
            (this.viewType() == 'helpView' && this.filteredSectionArticles() === null)
        );
    }, this);
}



var Model = require('../models/Model');
function Article(values) {

    Model(this);

    this.model.defProperties({
        id: 0,
        section_id: 0,
        title: '',
        description: '',
        tail: '',
        urlPath: ''
    }, values);
}

function Section(values) {

    Model(this);

    this.model.defProperties({
        id: 0,
        category_id: 0,
        name: '',
        description: '',
        tail: '',
        urlPath: ''
    }, values);
}

function Category(values) {

    Model(this);

    this.model.defProperties({
        id: 0,
        name: '',
        description: '',
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