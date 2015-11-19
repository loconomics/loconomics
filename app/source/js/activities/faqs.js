/**
    Faqs activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function FaqsActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
    
    // TestingData
    //setSomeTestingData(this.viewModel);
    this.currentLabels = '';
    this.loadArticles = function() {
        var url = 'https://loconomics.zendesk.com/api/v2/help_center/articles.json?label_names=' + encodeURIComponent(this.currentLabels);
        this.viewModel.isLoading(true);
        
        var $ = require('jquery');
        Promise.resolve($.get(url)).then(function(res) {
            if (res) {
                this.viewModel.faqs(res.articles.map(function(art) {
                    return new Faq({
                        id: art.id,
                        title: art.title,
                        description: art.body
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
});

exports.init = A.init;

A.prototype.show = function show(state) {
    
    Activity.prototype.show.call(this, state);
    
    this.viewModel.searchText('');
    this.loadArticles();
};

var ko = require('knockout');

function ViewModel() {

    this.faqs = ko.observableArray([]);
    this.searchText = ko.observable('');
    this.isLoading = ko.observable(false);
    
    this.filteredFaqs = ko.pureComputed(function() {
        var s = this.searchText().toLowerCase();
        return this.faqs().filter(function(v) {
            var n = v && v.title() || '';
            n += v && v.description() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);
}

var Model = require('../models/Model');
function Faq(values) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        title: '',
        description: ''
    }, values);
}

/** TESTING DATA **/
//function setSomeTestingData(viewModel) {
//    
//    var testdata = [
//        new Faq({
//            id: 1,
//            title: 'How do I set up a marketplace profile?',
//            description: 'Description about how I set up a marketplace profile'
//        }),
//        new Faq({
//            id: 2,
//            title: 'Another faq',
//            description: 'Another description'
//        })
//    ];
//    viewModel.faqs(testdata);
//}

