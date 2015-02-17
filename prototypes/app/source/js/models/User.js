/** User model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

// Enum UserType
var UserType = {
    None: 0,
    Anonymous: 1,
    Customer: 2,
    Provider: 4,
    Admin: 8,
    LoggedUser: 14,
    User: 15,
    System: 16
};

function User(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        email: '',
        firstName: '',
        middleIn: '',
        lastName: '',
        secondLastName: '',
        nickName: null,
        publicBio: null,
        genderID: 0,
        preferredLanguageID: null,
        preferredCountryID: null,
        isProvider: false,
        isCustomer: false,
        isMember: false,
        isAdmin: false,
        mobilePhone: null,
        alternatePhone: null,
        providerProfileURL: null,
        providerWebsiteURL: null,
        createdDate: null,
        updatedDate: null,
        modifiedBy: null,
        active: false,
        accountStatusID: 0,
        bookCode: null,
        onboardingStep: null,
        businessName: null,
        alternateEmail: null
    }, values);

    this.fullName = ko.computed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
    
    this.userType = ko.pureComputed({
        read: function() {
            var c = this.isCustomer(),
                p = this.isProvider(),
                a = this.isAdmin();
            
            var userType = 0;
            
            if (this.isAnonymous()) {
                userType = userType | UserType.Anonymous;
            }
            if (c)
                userType = userType | UserType.Customer;
            if (p)
                userType = userType | UserType.Provider;
            if (a)
                userType = userType | UserType.Admin;
            
            return userType;
        },
        /* NOTE: Not require for now:
        write: function(v) {
        },*/
        owner: this
    });
    
    this.isAnonymous = ko.pureComputed(function(){
        return this.userID() < 1;
    }, this);
    
    /**
        It matches a UserType from the enumeration?
    **/
    this.isUserType = function isUserType(type) {
        return (this.userType() & type);
    }.bind(this);
}

module.exports = User;

User.UserType = UserType;

/* Creatint an anonymous user with some pressets */
User.newAnonymous = function newAnonymous() {
    return new User({
        userID: 0,
        email: '',
        firstName: '',
        onboardingStep: null
    });
};
