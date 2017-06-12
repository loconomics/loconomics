'use strict';

var ko = require('knockout'),
    AlertLink = require('../../js/viewmodels/AlertLink'),
    ProfileAlert = require('../../js/models/ProfileAlert');

describe('models/AlertLink', function() {
    describe('href', function() {
        it('should be empty if name is unrecognized', function() {
            var l = AlertLink.fromProfileAlert(new ProfileAlert({ alertName: 'not a real name' }), { jobTitleID: 42 });

            expect(l.href()).to.equal('');
        });

        it('should be a string if the name is real', function() {
            var l = AlertLink.fromProfileAlert(new ProfileAlert({ alertName: 'location' }), { jobTitleID: 42  });

            expect(l.href()).to.not.be.empty;
        });
    });

    describe('label', function() {
        it('should be empty if name is unrecognized', function() {
            var l = AlertLink.fromProfileAlert(new ProfileAlert({ alertName: 'not a real name' }), { jobTitleID: 42 });

            expect(l.label()).to.equal('');
        });

        it('should be a string if the name is real', function() {
            var l = AlertLink.fromProfileAlert(new ProfileAlert({ alertName: 'location' }), {　jobTitleID: 42 });

            expect(l.label()).to.not.be.empty;
        });
    });
});
