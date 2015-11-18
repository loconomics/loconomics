/**
    Signup activity
**/
'use strict';

var Activity = require('../components/Activity'),
    SignupVM = require('../viewmodels/Signup');

var A = Activity.extends(function SignupActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new SignupVM(this.app);
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
    this.navBar.rightAction(null);
    
    // Redircect on success
    this.registerHandler({
        target: this.viewModel,
        event: 'signedup',
        handler: function() {
            if (this.app.goDashboard)
                // In App
                this.app.goDashboard();
            else
                // In Splash
                this.app.shell.go('#!splashThanks/' + this.viewModel.profile());
        }.bind(this)
    });
    
    // Focus first bad field on error
    this.registerHandler({
        target: this.viewModel,
        event: 'signuperror',
        handler: function(err) {
            if (err) {
                // Focus first field with error
                var $el = this.$activity.find('.form-group.has-error:first').find('input');
                setTimeout(function() {
                    // Because trying synchronously will not work on some cases
                    $el.focus();
                }, 100);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    this.viewModel.reset();

    Activity.prototype.show.call(this, options);
    
    var p = options && options.route && options.route.segments && options.route.segments[0] || '';
    this.viewModel.profile(p);
};
