/** User model **/
'use strict';

// Enum UserType
import Model from './Model';
import UserType from '../enums/UserType';
import ko from 'knockout';

var US_COUNTRY_ID = 1;

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

        isServiceProfessional: false,
        isClient: false,
        isAdmin: false,
        isCollaborator: false,
        isOrganization: false,

        photoUrl: null,

        onboardingStep: null,
        accountStatusID: 0,
        createdDate: null,
        updatedDate: null,
        languageID: null,
        countryID: null
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
            var c = this.isClient();
            var p = this.isServiceProfessional();
            var a = this.isAdmin();

            var userType = 0;

            if (this.isAnonymous())
                userType = userType | UserType.anonymous;
            if (c)
                userType = userType | UserType.client;
            if (p)
                userType = userType | UserType.serviceProfessional;
            if (a)
                userType = userType | UserType.admin;

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

    this.isUSUser = ko.pureComputed(function() {
        return this.countryID() == US_COUNTRY_ID;
    }, this);
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
