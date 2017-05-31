'use strict';

var ko = require('knockout'),
    createAlertLink = require('../../js/viewmodels/AlertLink'),
    ProfileAlert = require('../../js/models/ProfileAlert');

describe('models/AlertLabel', function() {
    describe('href', function() {
        it('should be empty if name is unrecognized', function() {
            var l = createAlertLink(new ProfileAlert({ alertName: 'not a real name' }), { jobTitleID: 42 });

            expect(l.href()).to.equal('');
        });

        it('should be a string if the name is real', function() {
            var l = createAlertLink(new ProfileAlert({ alertName: 'location' }), { jobTitleID: 42  });

            expect(l.href()).to.not.be.empty;
        });

        it('should be an observable value', function() {
            var l = createAlertLink(new ProfileAlert(), { jobTitleID: 42  });

            expect(ko.isObservable(l.href)).to.be.true;
        });
    });

    describe('label', function() {
        it('should be empty if name is unrecognized', function() {
            var l = createAlertLink(new ProfileAlert({ alertName: 'not a real name' }), { jobTitleID: 42 });

            expect(l.label()).to.equal('');
        });

        it('should be a string if the name is real', function() {
            var l = createAlertLink(new ProfileAlert({ alertName: 'location' }), {　jobTitleID: 42 });

            expect(l.label()).to.not.be.empty;
        });

        it('should be an observable value', function() {
            var l = createAlertLink(new ProfileAlert(), { jobTitleID: 42 });

            expect(ko.isObservable(l.label)).to.be.true;
        });
    });
});
