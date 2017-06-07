var Address = require('../../js/models/Address');

describe('models/Address', function() {
    var fullAddress = {
            addressLine1: '850 Mission St.',
            addressLine2: 'Ste. 34',
            postalCode: '94110',
            city: 'San Francisco',
            stateProvinceCode: 'CA',
        };

    describe('singleLine', function() {
        it('should be empty if all are empty', function() {
            var a = new Address();

            expect(a.singleLine()).to.equal('');
        });

        it('should include one item if all others are empty', function() {
            var tokyo = 'Tokyo',
                a = new Address({city: tokyo});

            expect(a.singleLine()).to.equal(tokyo);
        });

        it('should include address line 1, city, postal code, and state/province code', function() {
            var a = new Address(fullAddress);

            expect(a.singleLine()).to.equal('850 Mission St., San Francisco, 94110, CA');
        });
    }); // singleLine

    describe('addressLine', function() {
        it('should be empty if all are empty', function() {
            var a = new Address();

            expect(a.addressLine()).to.equal('');
        });

        it('should include one item if all others are empty', function() {
            var addressLine1 = '800 80th St',
                a = new Address({ addressLine1: addressLine1 });

            expect(a.addressLine()).to.equal(addressLine1);
        });

        it('it should separate address lines with a comma', function() {
            var a = new Address({ addressLine1: '800 80th St', addressLine2: 'Apt 3' });

            expect(a.addressLine()).to.equal('800 80th St, Apt 3');
        });
    }); // addressLine

    describe('cityState', function() {
        it('should be empty when both are empty', function() {
            var a = new Address();

            expect(a.cityState()).to.equal('');
        });

        it('should only include a city only if state is missing', function() {
            var tokyo = 'Tokyo',
                a = new Address({city: tokyo});

            expect(a.cityState()).to.equal(tokyo);
        });

        it('it should separate city and state with a comma', function() {
            var a = new Address(fullAddress);

            expect(a.cityState()).to.equal('San Francisco, CA');
        });
    }); // cityState

    describe('cityStateLine', function() {
        it('should be empty when all are empty', function() {
            var a = new Address();

            expect(a.cityStateLine()).to.equal('');
        });

        it('should only include one if the others are missing', function() {
            var tokyo = 'Tokyo',
                a = new Address({city: tokyo});

            expect(a.cityStateLine()).to.equal(tokyo);
        });

        it('it should separate city, state, and postal code with a comma', function() {
            var a = new Address(fullAddress);

            expect(a.cityStateLine()).to.equal('San Francisco, CA, 94110');
        });
    }); // cityStateLine
});
