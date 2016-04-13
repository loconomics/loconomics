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
        if(this.viewModel.faqs().length>0 && this.viewModel.sections().length>0){
            return ;
        }

        // var articleIdsRelatedTo = {'weeklySchedule':[205679005, 205282499]};
        var url = 'https://loconomics.zendesk.com/api/v2/help_center/articles.json?label_names=' + encodeURIComponent(this.currentLabels);
        var category_id = 200431835; // we only care about Service Professionals right now
        var sectionsUrl = 'https://loconomics.zendesk.com/api/v2/help_center/categories/'+ category_id +'/sections.json';
        this.viewModel.isLoading(true);

        var $ = require('jquery');
        Promise.all([$.get(url), $.get(sectionsUrl)]).then(function(res) {
            var resArticles = res[0];
            var resSections = res[1];

            if(resSections){
                this.viewModel.sections(
                    resSections.sections.map(function(section){
                        var tail = section.id + '-' + slug(section.name);
                        return new Section({
                            id: section.id,
                            category_id: section.category_id,
                            name: section.name,
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
                this.viewModel.faqs(resArticles.articles.map(function(art) {
                    var tail = art.id + '-' + slug(art.title);
                    return new Faq({
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
                this.viewModel.faqs([]);
            }
            this.viewModel.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.viewModel.isLoading(false);
        }.bind(this));
    }.bind(this);


    this.subSectionFunction = {
        "sections": function(tailId){
            this.viewModel.selectedSectionId(Number(tailId));
            this.viewModel.viewType('sectionView');
        }.bind(this),
        "articles": function(tailId){
            this.viewModel.selectedArticleId(Number(tailId));
            this.viewModel.viewType('articleView');
        }.bind(this),
        "faqs": function(tailId){
            this.viewModel.relatedView(tailId.toString());
            this.viewModel.viewType('helpView');
        }.bind(this),
    };

    this.renderSubSection = function(subSectionPath, tail){
        var tailId = tail.split('-')[0];
        if(tailId === ''){
            // for sectionView
            if(subSectionPath ==="sections"){
                this.viewModel.viewType('viewAllSections');
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

    var subSections = ['articles', 'sections', 'faqs'];
    this.viewModel.viewType('');
    if(params){
        var subSectionPath = params[0] || '';
        var tail = params[1] || '';

        if(subSections.indexOf(subSectionPath)>-1){
            this.renderSubSection(subSectionPath, tail);
        }
        else if( subSectionPath === ''){
            this.viewModel.viewType('viewAllSections');
        }
        else{
            this.viewModel.viewType('404');
        }
    }
};

var ko = require('knockout');

function ViewModel() {


    this.faqs = ko.observableArray([]);
    this.searchText = ko.observable('');
    this.isLoading = ko.observable(false);
    this.params = ko.observableArray(''); // sections/2342342342-stuff-i-do
    this.viewType = ko.observable('');

    this.tailId = ko.observable('');

    this.sections = ko.observableArray([]);

    this.selectedArticleId = ko.observable(0);

    this.selectedSectionId = ko.observable(0);

    this.fullArticleData = ko.pureComputed(function() {
        var selectedArticleId = this.selectedArticleId();
        return this.faqs().filter(function(article) {
            var articleIsSelected = article.id() === selectedArticleId;
            return articleIsSelected;
        });
    }, this);

    this.selectedSection = ko.pureComputed(function(){
        var selectedSectionId = this.selectedSectionId();
        return this.sections().filter(function(section) {
            var sectionIsSelected = section.id() === selectedSectionId;
            return sectionIsSelected;
        });
    }, this);

    this.filteredSectionArticles = ko.pureComputed(function() {
        var selectedSectionId = this.selectedSectionId();
        return this.faqs().filter(function(article) {
            var articleIsSelected = article.section_id() === selectedSectionId;
            return articleIsSelected;
        });
    }, this);

    this.relatedView = ko.observable('');
    this.articleIdsRelatedTo = {'weeklySchedule':[205679005, 205282499]};
    this.filteredHelpArticles = ko.pureComputed(function() {
        var relatedView = this.relatedView();
        var articleIdsRelatedTo = this.articleIdsRelatedTo;
        return this.faqs().filter(function(article) {
            var aId = article.id();
            var relatedArticles = articleIdsRelatedTo[relatedView] || "";
            var articleIsSelected = (relatedArticles.indexOf(aId) > -1);
            return articleIsSelected;
        });
    }, this);

    this.filteredFaqs = ko.pureComputed(function() {
        var s = this.searchText().toLowerCase();
        return this.faqs().filter(function(v) {
            var n = v && v.title() || '';
            n += v && v.description() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);

    this.nothingFound = ko.pureComputed(function(){
        // if any of the below arguments are true
        // then "Nothing is found."
        return (
            !this.filteredFaqs().length +
            (this.viewType() == '404') +
            (this.viewType() == 'viewAllSections' && !this.sections().length) +
            (this.viewType() == 'sectionView' && !this.filteredSectionArticles().length) +
            (this.viewType() == 'viewAllArticles' && !this.filteredFaqs().length) +
            (this.viewType() == 'articleView' && !this.fullArticleData().length) +
            (this.viewType() == 'helpView' && !this.filteredHelpArticles().length)
        );
    }, this);
}



var Model = require('../models/Model');
function Faq(values) {

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