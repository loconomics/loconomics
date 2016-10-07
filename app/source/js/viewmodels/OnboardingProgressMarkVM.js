/**
    View Model for the OnboardingProgressMark component
**/
'use strict';
var ko = require('knockout');

module.exports = function OnboardingProgressMarkVM(app) {
    var o = app.model.onboarding;
    this.progressText = o.progressText;
    var getClassNames = function(i) {
        var n = o.stepNumber();
        if (i < n) {
            return 'ion-ios-checkmark text-success';
        }
        else if (i === n) {
            return 'ion-ios-checkmark-outline text-success';
        }
        else {
            return 'ion-ios-checkmark-outline';
        }
    };
    this.marks = ko.pureComputed(function() {
        var t = o.totalSteps();
        var l = [];
        for (var i = 1; i <= t; i++) {
            l.push({
                classNames: ko.pureComputed(getClassNames.bind(null, i))
            });
        }
        return l;
    }, this);
};
