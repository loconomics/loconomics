/**
    Help activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
var help = require('../data/help');

var A = Activity.extend(function HelpActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();
    this.accessLevel = null;

    this.navBar = Activity.createSubsectionNavBar('Back');
    this.title("We're here to help");

    // TestingData
    //setSomeTestingData(this.viewModel);
    this.currentLabels = '';
    this.loadArticles = function() {
        // don't load if faqs and sections are already loaded
        if(this.viewModel.articles().length && this.viewModel.sections().length){
            return;
        }

        this.viewModel.isLoading(true);

        Promise.all([
            help.getArticles(),
            help.getCategories(),
            help.getSections()
        ])
        .then(function(res) {
            this.viewModel.articles(res[0]);
            this.viewModel.categories(res[1]);
            this.viewModel.sections(res[2]);
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
    this.isInOnboarding = onboarding.inProgress;
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
        return help.findByIdAt(this.selectedArticleId(), this.articles());
    }, this);

    this.selectedSection = ko.pureComputed(function(){
        return help.findByIdAt(this.selectedSectionId(), this.sections());
    }, this);

    this.selectedCategory = ko.pureComputed(function(){
        return help.findByIdAt(this.selectedCategoryId(), this.categories());
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

