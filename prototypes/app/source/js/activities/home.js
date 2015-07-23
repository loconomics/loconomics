/**
    Home activity (aka Search)
**/
'use strict';

var Activity = require('../components/Activity'),
    snapPoints = require('../utils/snapPoints');

var A = Activity.extends(function HomeActivity() {
    
    Activity.apply(this, arguments);
    this.navBar = null;

    this.accessLevel = null;
    
    var $header = this.$header = this.$activity.find('header');

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-fixed-header',
        handler: function(e, what) {
            if (what === 'after') {
                $header.addClass('is-fixed');
            }
            else {
                $header.removeClass('is-fixed');
            }
        }
    });

    this.registerHandler({
        target: this.$activity,
        event: 'scroll-search',
        handler: function(e, what) {
            if (what === 'after') {
                $header.addClass('is-search');
            }
            else {
                $header.removeClass('is-search');
            }
        }
    });
});

exports.init = A.init;

A.prototype._registerSnapPoints = function() {

    var $searchBox = this.$activity.find('#homeSearch'),
        // Calculate the position where search box is completely hidden, and get 1 on the worse case -- bad value coerced to 0,
        // negative result because some lack of data (content hidden)
        searchPoint = Math.max(1, (
            // Top offset with the scrolling area plus current scrollTop to know the actual position inside the positioning context
            // (is an issue if the section is showed with scroll applied on the activity)
            $searchBox.offset().top + this.$activity.scrollTop() +
            // Add the box height but sustract the header height because that is fixed and overlaps
            $searchBox.outerHeight() - this.$header.outerHeight()
        ) |0);
    
    var pointsEvents = {
        // Just after start scrolling
        0: 'scroll-fixed-header'
    };
    pointsEvents[searchPoint] = 'scroll-search';

    snapPoints(this.$activity, pointsEvents);
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    if (!this._notFirstShow) {
        this._registerSnapPoints();
        this._notFirstShow = true;
    }
};
