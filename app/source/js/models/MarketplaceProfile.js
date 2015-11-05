/** MarketplaceProfile model **/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

function MarketplaceProfile(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        
        publicBio: '',
        serviceProfessionalProfileUrlSlug: '',
        // This is a server-side computed variable (read-only for the user) for a Loconomics address
        // created using the serviceProfessionalProfileUrlSlug if any or the fallback system URL.
        serviceProfessionalProfileUrl: '',
        // Specify an external website of the serviceProfessional.
        serviceProfessionalWebsiteUrl: '',
        // Server-side generated code that allows to identificate special booking requests
        // from the book-me-now button. The server ensures that there is ever a value on this for serviceProfessionals.
        bookCode: '',

        createdDate: null,
        updatedDate: null
    }, values);
    
    // Special observable: photoUrl, is a well know URL, no saved on database, based on the userID
    // and the channel being in use
    this.photoUrl = ko.pureComputed(function() {
        var $ = require('jquery');
        var siteUrl = $('html').attr('data-site-url') || 'https://loconomics.com';
        return siteUrl + '/en-US/Profile/Photo/' + this.userID();
    }, this);
}

module.exports = MarketplaceProfile;
