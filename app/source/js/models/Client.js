/** client model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Client(values) {
    
    Model(this);
    
    this.model.defProperties({
        clientUserID: 0,
        
        firstName: '',
        lastName: '',
        secondLastName: '',
        email: '',
        phone: null,
        canReceiveSms: false,
        birthMonthDay: null,
        birthMonth: null,
        
        notesAboutclient: null,
        
        createdDate: null,
        updatedDate: null,
        editable: false
    }, values);

    this.fullName = ko.pureComputed(function() {
        return ((this.firstName() || '') + ' ' + (this.lastName() || ''));
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
}

module.exports = Client;
