'use strict';

var phoneValidationRegex = require('../../js/utils/phoneValidationRegex');

describe('utils/phoneValidationRegex', function() {

    describe('GENERAL_VALID_CHARS', function() {
        var pattern = phoneValidationRegex.GENERAL_VALID_CHARS;

        it('should fail on empty string', function() {
            var value = '';
            expect(pattern.test(value)).to.be.false;
        });
        it('should fail on null', function() {
            var value = null;
            expect(pattern.test(value)).to.be.false;
        });
        it('should fail on undefined', function() {
            var value;
            expect(pattern.test(value)).to.be.false;
        });

        it('should allow digits only', function() {
            var value = '123456789';
            expect(pattern.test(value)).to.be.true;
        });
        it('should allow digits and parenthesis', function() {
            var value = '(123)456789';
            expect(pattern.test(value)).to.be.true;
        });
        it('should allow digits and whitespaces', function() {
            var value = '123 456 789';
            expect(pattern.test(value)).to.be.true;
        });
        it('should allow digits and dashes', function() {
            var value = '123-456-789';
            expect(pattern.test(value)).to.be.true;
        });
        it('should allow digits and dots', function() {
            var value = '123.456.789';
            expect(pattern.test(value)).to.be.true;
        });
        it('should allow digits, parenthesis, dashes, whitespaces and dots', function() {
            var value = '(123) 456-789.3';
            expect(pattern.test(value)).to.be.true;
        });
    });

    describe('NORTH_AMERICA_PATTERN', function() {
        var pattern = phoneValidationRegex.NORTH_AMERICA_PATTERN;

        it('should fail on empty string', function() {
            var value = '';
            expect(pattern.test(value)).to.be.false;
        });
        it('should fail on null', function() {
            var value = null;
            expect(pattern.test(value)).to.be.false;
        });
        it('should fail on undefined', function() {
            var value;
            expect(pattern.test(value)).to.be.false;
        });

        it('should allow digits only between 10-14', function() {
            expect(pattern.test('123456789')).to.be.false;
            expect(pattern.test('1234567890')).to.be.true;
            expect(pattern.test('12345678901')).to.be.true;
            expect(pattern.test('123456789012')).to.be.true;
            expect(pattern.test('1234567890123')).to.be.true;
            expect(pattern.test('12345678901234')).to.be.true;
            expect(pattern.test('123456789012345')).to.be.false;
        });
        it('should allow pattern (123) 456-7890 (3digits 3digits 4to8digits)', function() {
            expect(pattern.test('(12) 456-7890')).to.be.false;
            expect(pattern.test('(123) 45-7890')).to.be.false;
            expect(pattern.test('(123) 456-789')).to.be.false;
            expect(pattern.test('(1233) 456-7890')).to.be.false;
            expect(pattern.test('(123) 4566-7890')).to.be.false;
            expect(pattern.test('(123) 456-7890')).to.be.true;
            expect(pattern.test('(123) 456-78901')).to.be.true;
            expect(pattern.test('(123) 456-789012')).to.be.true;
            expect(pattern.test('(123) 456-7890123')).to.be.true;
            expect(pattern.test('(123) 456-78901234')).to.be.true;
            expect(pattern.test('(123) 456-789012345')).to.be.false;
        });
        it('should allow pattern 123-456-7890 (3digits 3digits 4to8digits)', function() {
            expect(pattern.test('12-456-7890')).to.be.false;
            expect(pattern.test('123-45-7890')).to.be.false;
            expect(pattern.test('123-456-789')).to.be.false;
            expect(pattern.test('1233-456-7890')).to.be.false;
            expect(pattern.test('123-4566-7890')).to.be.false;
            expect(pattern.test('123-456-7890')).to.be.true;
            expect(pattern.test('123-456-78901')).to.be.true;
            expect(pattern.test('123-456-789012')).to.be.true;
            expect(pattern.test('123-456-7890123')).to.be.true;
            expect(pattern.test('123-456-78901234')).to.be.true;
            expect(pattern.test('123-456-789012345')).to.be.false;
        });
        it('should allow pattern 123.456.7890 (3digits 3digits 4to8digits)', function() {
            expect(pattern.test('12.456.7890')).to.be.false;
            expect(pattern.test('123.45.7890')).to.be.false;
            expect(pattern.test('123.456.789')).to.be.false;
            expect(pattern.test('1233.456.7890')).to.be.false;
            expect(pattern.test('123.4566.7890')).to.be.false;
            expect(pattern.test('123.456.7890')).to.be.true;
            expect(pattern.test('123.456.78901')).to.be.true;
            expect(pattern.test('123.456.789012')).to.be.true;
            expect(pattern.test('123.456.7890123')).to.be.true;
            expect(pattern.test('123.456.78901234')).to.be.true;
            expect(pattern.test('123.456.789012345')).to.be.false;
        });
    });
});
