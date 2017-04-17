var OnboardingProgress = require('../../js/viewmodels/OnboardingProgress');

describe('viewmodels/OnboardingProgress', function() {
  describe('default', function() {
    it('should be finished', function() {
        var p = new OnboardingProgress();

        expect(p.isFinished()).to.be.true;
    });
  });
});
