/** SplashAppModel, centralizes data tasks for the Splash page.
**/
var $ = require('jquery'),
    Rest = require('../utils/Rest');

function SplashAppModel() {}

module.exports = SplashAppModel;

/** Initialize and wait for anything up **/
SplashAppModel.prototype.init = function init() {
    var config = {
        siteUrl: $('html').attr('data-site-url')
    };
    this.rest = new Rest(config.siteUrl + '/api/v1/en-US/');
    return Promise.resolve();
};
// Simplified signup
SplashAppModel.prototype.signup = function signup(data) {

    // Reset the extra headers to attempt the signup
    this.rest.extraHeadres = null;

    data.returnProfile = true;

    // The result is the same as in a login, and
    // we do the same as there to get the user logged
    // on the app on sign-up success.
    return this.rest.post('signup?utm_source=splash', data);
};
