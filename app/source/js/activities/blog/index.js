/**
 * Blog activity
 *
 * @module activities/blog
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/nav/website-footer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import Model from '../../models/Model';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'blog';
const BLOG_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/loconomics.wordpress.com/posts/';

export default class BlogActivity extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar('Blog');
        this.title('Loconomics blog');

        // TODO: Refactor original Activity and ViewModel members

        this.blog = ko.observableArray([]);
        this.searchText = ko.observable('');
        this.searchDate = ko.observable('');
        this.searchTags = ko.observable('');
        this.isLoading = ko.observable(false);
        this.params = ko.observable(''); // sections/2342342342-stuff-i-do
        this.viewType = ko.observable('');

        this.tailId = ko.observable('');

        this.selectedPostId = ko.observable(0);

        this.fullPostData = ko.pureComputed(() => {
            var selectedPostId = this.selectedPostId();
            var result = this.blog().filter(function(post) {
                var postIsSelected = post.id() === selectedPostId;
                return postIsSelected;
            });
            return result.length ? result[0]:null;
        });

        this.filteredPostsBySearch = ko.pureComputed(() => {
            var s = this.searchText().toLowerCase();
            return this.blog().filter(function(v) {
                var n = v && v.title() || '';
                n += v && v.content() || '';
                n += v && v.date() || '';
                n += v && v.tags() || '';
                n = n.toLowerCase();
                return n.indexOf(s) > -1;
            });
        });

        this.filteredPostsByDate = ko.pureComputed(() => {
            var s = this.searchDate();
            return this.blog().filter(function(v) {
                var n = v && v.date() || '';
                n = n.toLowerCase();
                return n.indexOf(s) > -1;
            });
        });

        this.filteredPostsByTags = ko.pureComputed(() => {
            var s = this.searchTags().toLowerCase();
            return this.blog().filter(function(v) {
                var n = v && v.tags() || '';
                n = n.toLowerCase();
                return n.indexOf(s) > -1;
            });
        });

        this.nothingFound = ko.pureComputed(() => {
            // if any of the below arguments are true
            // then "Nothing is found."
            const t = (
                !this.filteredPostsBySearch().length +
                (this.viewType() == 'blogView' && !this.filteredPostsBySearch().length)
            );
            return t;
        });

        this.currentLabels = '';
        this.loadPosts = () => {
            // don't load if blog is already loaded
            if(this.blog().length>0){
                return ;
            }
            var url = BLOG_URL + encodeURIComponent(this.currentLabels);
            this.isLoading(true);

            var $ = require('jquery');
            Promise.resolve($.get(url)).then((resPosts) => {
                if (resPosts) {
                    this.blog(resPosts.posts.map((post) => {
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
                    this.blog([]);
                }
                this.isLoading(false);
            })
            .catch((/*err*/) => {
                this.isLoading(false);
            });
        };

        this.subSectionFunction = {
            "posts": (tailId) => {
                this.selectedPostId(parseInt(tailId, 10));
                this.viewType('postView');
            },
        };

        this.renderSubSection = (subSectionPath, tail) => {
            var tailId = tail.split('-')[0];
            if(tailId === ''){
                // for postView
                if(subSectionPath ==="posts"){
                    this.viewType('postView');
                }
                // for articleView and blogView
                else{
                    this.viewType('blogView');
                }
            }
            else{
                this.subSectionFunction[subSectionPath](tailId);
            }
        };
    }

    show(state) {
        super.show(state);

        this.searchText('');
        this.loadPosts();

        var params = state.route.segments;

        var subSections = ['posts'];
        this.viewType('');
        if(params) {
            var subSectionPath = params[0] || '';
            var tail = params[1] || '';

            if(subSections.indexOf(subSectionPath)>-1){
                this.renderSubSection(subSectionPath, tail);
            }
            else if( subSectionPath === ''){
                this.viewType('blogView');
            }
            else{
                this.viewType('404');
            }
        }
    }
}

activities.register(ROUTE_NAME, BlogActivity);

/// Inlined utils
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
