/**
 * Help
 *
 * @module activities/help
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import help from '../../data/help';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import template from './template.html';

const ROUTE_NAME = 'help';

export default class Help extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSubsectionNavBar('Back');
        this.title("We're here to help");

        this.__defViewProperties();
    }

    __defViewProperties() {
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

        this.fullArticleData = ko.pureComputed(() => help.findByIdAt(this.selectedArticleId(), this.articles()));
        this.selectedSection = ko.pureComputed(() => help.findByIdAt(this.selectedSectionId(), this.sections()));
        this.selectedCategory = ko.pureComputed(() => help.findByIdAt(this.selectedCategoryId(), this.categories()));

        this.filteredSectionArticles = ko.pureComputed(() => {
            var selectedSectionId = this.selectedSectionId();
             var result = this.articles().filter(function(article) {
                var articleIsSelected = article.section_id() === selectedSectionId;
                return articleIsSelected;
            });
            return result.length ? result:null;
        });

        this.filteredCategorySections = ko.pureComputed(() => {
            var selectedCategoryId = this.selectedCategoryId();
             var result = this.sections().filter(function(section) {
                var sectionIsSelected = section.category_id() === selectedCategoryId;
                return sectionIsSelected;
            });
            return result.length ? result:null;
        });

        this.filteredArticles = ko.pureComputed(() => {
            var s = this.searchText().toLowerCase();
             var result = this.articles().filter((v) => {
                var n = v && v.title() || '';
                n += v && v.description() || '';
                n = n.toLowerCase();
                return n.indexOf(s) > -1;
            });
            return result.length ? result:null;
        });

        this.nothingFound = ko.pureComputed(() => {
            // if any of the below arguments are true
            // then "Nothing is found."
            const r = (
                this.filteredArticles() === null +
                (this.viewType() == '404') +
                (this.viewType() == 'viewAllSections' && this.sections() === null) +
                (this.viewType() == 'categoryView' && this.filteredCategorySections() === null) +
                (this.viewType() == 'sectionView' && this.filteredSectionArticles() === null) +
                (this.viewType() == 'viewAllArticles' && this.articles() === null) +
                (this.viewType() == 'articleView' && this.fullArticleData() === null) +
                (this.viewType() == 'helpView' && this.filteredSectionArticles() === null)
            );
            return r;
        });
    }

    show(state) {
        super.show(state);

        this.searchText('');
        this.loadArticles();

        var params = state.route.segments;

        var subSections = ['articles', 'sections', 'categories', 'relatedArticles'];
        this.viewType('');
        if(params) {
            var subSectionPath = params[0] || '';
            var tail = params[1] || '';

            if(subSections.indexOf(subSectionPath) > -1){
                this.renderSubSection(subSectionPath, tail);
            }
            else if(subSectionPath === ''){
                this.viewModel.viewType('viewAllCategories');
            }
            else {
                this.viewModel.viewType('404');
            }
        }
    }

    loadArticles() {
        // don't load if faqs and sections are already loaded
        if(this.articles().length && this.sections().length){
            return;
        }

        this.isLoading(true);

        Promise.all([
            help.getArticles(),
            help.getCategories(),
            help.getSections()
        ])
        .then((res) => {
            this.articles(res[0]);
            this.categories(res[1]);
            this.sections(res[2]);
            this.isLoading(false);
        })
        .catch((/*err*/) => {
            this.isLoading(false);
        });
    }

    renderSubSection(subSectionPath, tail){
        var tailId = tail.split('-')[0];
        if(tailId === '') {
            switch (subSectionPath) {
                // for categoryView
                case 'categories':
                    this.viewType('viewAllCategories');
                    break;
                // for sectionView
                case 'sections':
                    this.viewType('viewAllSections');
                    break;
                // for sectionView
                case 'articles':
                    this.viewType('articleView');
                    break;
                // for sectionView
                case 'relatedArticles':
                    this.viewType('helpView');
                    break;
                // for articleView and helpView
                default:
                    this.viewType('viewAllArticles');
                    break;
            }
        }
        else {
            const capitalizedPath = subSectionPath.replace(/^./, (t) => t.toUpperCase());
            this['render' + capitalizedPath](tailId);
        }
    }

    renderCategories(tailId) {
        this.selectedCategoryId(parseInt(tailId, 10));
        this.viewType('categoryView');
    }

    renderSections(tailId) {
        this.selectedSectionId(parseInt(tailId, 10));
        this.viewType('sectionView');
    }

    renderArticles(tailId) {
        this.selectedArticleId(parseInt(tailId, 10));
        this.viewType('articleView');
    }

    renderRelatedArticles(tailId) {
        this.selectedSectionId(parseInt(tailId, 10));
        this.viewType('helpView');
    }
}

activities.register(ROUTE_NAME, Help);
