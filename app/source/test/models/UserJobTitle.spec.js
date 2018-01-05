'use strict';

var UserJobTitle = require('../../js/models/UserJobTitle');
var ProfileAlert = require('../../js/models/ProfileAlert');

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
            var d = Date.now();
            var j = new UserJobTitle({ createdDate: d });

            expect(j.createdDate()).to.equal(d);
        });
    });

    describe('updatedDate', function() {
        it('should be a model field', function() {
            var d = Date.now();
            var j = new UserJobTitle({ updatedDate: d });

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
            var requiredAlert = new ProfileAlert({ isRequired: true });
            var requiredAlert2 = new ProfileAlert({ isRequired: true });
            var optionalAlert = new ProfileAlert({ isRequired: false });
            var j = new UserJobTitle({ alerts: [optionalAlert, requiredAlert, requiredAlert2] });

            expect(j.requiredAlerts().length).to.equal(2);
        });
    });

    describe('isComplete', function() {
        it('should be true if there are no required alerts and status is not incomplete', function() {
            var optionalAlert = new ProfileAlert({ isRequired: false });
            var j = new UserJobTitle({ alerts: [optionalAlert], statusID: UserJobTitle.status.off });

            expect(j.isComplete()).to.be.equal(true);
        });

        it('should be false if status is incomplete', function() {
            var j = new UserJobTitle({ statusID: UserJobTitle.status.incomplete });

            expect(j.isComplete()).to.be.equal(false);
        });

        it('should be false if there are required alerts', function() {
            var requiredAlert = new ProfileAlert({ isRequired: true });
            var j = new UserJobTitle({ alerts: [requiredAlert], statusID: UserJobTitle.status.on });

            expect(j.isComplete()).to.be.equal(false);
        });
    });
});
