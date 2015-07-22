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
    
    snapPoints(this.$activity, {
        0: 'fixed-header'
    }, 0);
    
    var $header = this.$activity.find('header');

    this.registerHandler({
        target: this.$activity,
        event: 'fixed-header',
        handler: function(e, what) {
            if (what === 'after') {
                $header.addClass('is-fixed');
            }
            else {
                $header.removeClass('is-fixed');
            }
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
};
