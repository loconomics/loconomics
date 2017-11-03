/** OnboardingProgress view model.
    It tracks the onboarding information and methods
    to update views to that state
**/
var Model = require('../models/Model'),
    ko = require('knockout');

function OnboardingProgress(values) {
    var stepNumberFinished = -1;

    Model(this);

    this.model.defProperties({
        stepNumber: stepNumberFinished,
        // Let's set a job title to pass in to jobTitleSpecific steps as URL segment
        selectedJobTitleID: null
    }, values);

    this.totalSteps = ko.pureComputed(function() {
        // 'Zero' step is a welcome, not accounted:
        return this.stepNames.length - 1;
    }, this);

    this.incrementStep = function() {
        var currentStep = this.stepNumber();

        if(this.isFinished()) {
            return;
        }
        else if(currentStep == (this.stepNames.length - 1)){
            this.finish();
        }
        else {
            this.stepNumber(currentStep + 1);
        }
    };

    this.stepAfter = function(stepName) {
        var nextStep = new OnboardingProgress({ selectedJobTitleID: this.selectedJobTitleID() });
        nextStep.setStepByName(stepName);
        nextStep.incrementStep();

        return nextStep;
    };

    this.stepName = ko.pureComputed(function() {
        return this.stepNames[this.stepNumber()] || null;
    }, this);

    this.stepNames = OnboardingProgress.steps.names;

    this.stepUrl = ko.pureComputed(function() {
        var name = this.stepName();
        if (!name) return null;
        var url = '/' + name;

        // Check if there is need for a jobTitleID in the URL
        var def = OnboardingProgress.steps.definitions[name];
        var jobID = this.selectedJobTitleID();
        if (jobID && def && def.jobTitleSpecific) {
            url += '/' + jobID;
        }

        return url;
    }, this);

    this.progressText = ko.pureComputed(function() {
        // TODO L18N
        return this.stepNumber() + ' of ' + this.totalSteps();
    }, this);

    this.inProgress = ko.pureComputed(function() {
        return !this.isFinished();
    }, this);

    this.finish = function() {
        this.stepNumber(stepNumberFinished);
    };

    this.isFinished = ko.pureComputed(function() {
        return this.stepNumber() === stepNumberFinished;
    }, this);
}

module.exports = OnboardingProgress;

OnboardingProgress.prototype.setStepByName = function setStepByName(name) {
    var stepIndex = this.stepNames.indexOf(name);
    if (stepIndex > -1) {
        this.stepNumber(stepIndex);
        return true;
    }
    return false;
};

// Definitions of the steps for 'welcome' onboarding, for any relevant set-up needed
// on there, like if they need a jobTitleID
// IMPORTANT: A server side feature at sign-up depends strictly on the order
// of the first three steps, to skip the addJobTitle when a jobTitle is
// given in the process, so move directly into schedulingPreferences.
// If this changes, the server must be udpated properly or some steps
// may end being skipt wrongly
OnboardingProgress.steps = {
    names: [
        'welcome',
        'publicContactInfo',
        'addJobTitle',
        'schedulingPreferences',
        'serviceProfessionalService',
        'serviceAddresses',
        'licensesCertifications'
    ],
    definitions: {
        welcome: {},
        publicContactInfo: {},
        addJobTitle: {},
        schedulingPreferences: {},
        serviceProfessionalService: {
            jobTitleSpecific: true
        },
        serviceAddresses: {
            jobTitleSpecific: true
        },
        licensesCertifications: {
            jobTitleSpecific: true
        }
    }
};
