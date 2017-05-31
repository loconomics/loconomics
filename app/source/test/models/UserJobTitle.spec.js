'use strict';

var UserJobTitle = require('../../js/models/UserJobTitle'),
    ProfileAlert = require('../../js/models/ProfileAlert');

describe('models/UserJobTitle', function() {
    describe('userID', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ userID: 42 });

            expect(j.userID()).to.equal(42);
        });
    });

    describe('jobTitleID', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ jobTitleID: 42 });

            expect(j.jobTitleID()).to.equal(42);
        });
    });

    describe('intro', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ intro: '42' });

            expect(j.intro()).to.equal('42');
        });
    });

    describe('statusID', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ statusID: 3 });

            expect(j.statusID()).to.equal(3);
        });
    });

    describe('cancellationPolicyID', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ cancellationPolicyID: 2 });

            expect(j.cancellationPolicyID()).to.equal(2);
        });
    });

    describe('instantBooking', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ instantBooking: true });

            expect(j.instantBooking()).to.equal(true);
        });
    });

    describe('bookMeButtonReady', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ bookMeButtonReady: true });

            expect(j.bookMeButtonReady()).to.equal(true);
        });
    });

    describe('collectPaymentAtBookMeButton', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ collectPaymentAtBookMeButton: true });

            expect(j.collectPaymentAtBookMeButton()).to.equal(true);
        });
    });

    describe('createdDate', function() {
        it('should be a model field', function() {
            var d = Date.now(),
                j = new UserJobTitle({ createdDate: d });

            expect(j.createdDate()).to.equal(d);
        });
    });

    describe('updatedDate', function() {
        it('should be a model field', function() {
            var d = Date.now(),
                j = new UserJobTitle({ updatedDate: d });

            expect(j.updatedDate()).to.equal(d);
        });
    });

    describe('alerts', function() {
        it('should be a model field', function() {
            var j = new UserJobTitle({ alerts: [new ProfileAlert()] });

            expect(j.alerts()).to.not.be.empty;
        });
    });

    describe('requiredAlerts', function() {
        it('should be empty if there are no alerts', function() {
            var j = new UserJobTitle({ alerts: [] });

            expect(j.requiredAlerts()).to.be.empty;
        });

        it('should only include required alerts', function() {
            var requiredAlert = new ProfileAlert({ isRequired: true }),
                requiredAlert2 = new ProfileAlert({ isRequired: true }),
                optionalAlert = new ProfileAlert({ isRequired: false }),
                j = new UserJobTitle({ alerts: [optionalAlert, requiredAlert, requiredAlert2] });

            expect(j.requiredAlerts().length).to.equal(2);
        });
    });
});
