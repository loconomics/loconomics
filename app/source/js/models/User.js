/** User model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

// Enum UserType
var UserType = {
    None: 0,
    Anonymous: 1,
    Customer: 2,
    Freelancer: 4,
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
        lastName: '',
        secondLastName: '',
        businessName: '',
        
        alternativeEmail: '',
        phone: '',
        canReceiveSms: '',
        birthMonthDay: null,
        birthMonth: null,
        
        isFreelancer: false,
        isCustomer: false,
        isMember: false,
        isAdmin: false,

        onboardingStep: null,
        accountStatusID: 0,
        createdDate: null,
        updatedDate: null
    }, values);

    this.fullName = ko.pureComputed(function() {
        var nameParts = [this.firstName()];
        if (this.lastName())
            nameParts.push(this.lastName());
        if (this.secondLastName())
            nameParts.push(this.secondLastName);
        
        return nameParts.join(' ');
    }, this);
    
    this.birthDay = ko.pureComputed(function() {
        if (this.birthMonthDay() &&
            this.birthMonth()) {
            
            // TODO i10n
            return this.birthMonth() + '/' + this.birthMonthDay();
        }
        else {
            return null;
        }
    }, this);
    
    this.userType = ko.pureComputed({
        read: function() {
            var c = this.isCustomer(),
                p = this.isFreelancer(),
                a = this.isAdmin();
            
            var userType = 0;
            
            if (this.isAnonymous())
                userType = userType | UserType.Anonymous;
            if (c)
                userType = userType | UserType.Customer;
            if (p)
                userType = userType | UserType.Freelancer;
            if (a)
                userType = userType | UserType.Admin;
            
            return userType;
        },
        /* NOTE: Not required for now:
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
