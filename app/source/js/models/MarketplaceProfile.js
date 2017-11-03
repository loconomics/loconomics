/** MarketplaceProfile model **/
'use strict';

var Model = require('./Model');

function MarketplaceProfile(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        
        publicBio: '',
        businessName: '',
        serviceProfessionalProfileUrlSlug: '',
        // This is a server-side computed variable (read-only for the user) for a Loconomics address
        // created using the serviceProfessionalProfileUrlSlug if any or the fallback system URL.
        serviceProfessionalProfileUrl: '',
        // Specify an external website of the serviceProfessional.
        serviceProfessionalWebsiteUrl: '',
        // Server-side generated code that allows to identificate special booking requests
        // from the book-me-now button. The server ensures that there is ever a value on this for serviceProfessionals.
        bookCode: '',
        
        photoUrl: '',

        createdDate: null,
        updatedDate: null
    }, values);
}

module.exports = MarketplaceProfile;
