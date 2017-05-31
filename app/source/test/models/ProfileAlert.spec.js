var ProfileAlert = require('../../js/models/ProfileAlert');

describe('models/ProfileAlert', function() {
    describe('alertID', function() {
        it('should be a model field', function() {
            var a = new ProfileAlert({ alertID: 42 });

            expect(a.alertID()).to.equal(42);
        });
    });

    describe('alertName', function() {
        it('should be a model field', function() {
            var a = new ProfileAlert({ alertName: '42' });

            expect(a.alertName()).to.equal('42');
        });
    });

    describe('displayRank', function() {
        it('should be a model field', function() {
            var a = new ProfileAlert({ displayRank: 42 });

            expect(a.displayRank()).to.equal(42);
        });
    });

    describe('isRequired', function() {
        it('should be a model field', function() {
            var a = new ProfileAlert({ isRequired: true });

            expect(a.isRequired()).to.be.true;
        });
    });
});
