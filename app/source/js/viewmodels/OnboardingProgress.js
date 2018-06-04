/** OnboardingProgress view model.
    It tracks the onboarding information and methods
    to update views to that state
**/
var Model = require('../models/Model');
var ko = require('knockout');

/**
 * Definition of steps, in strict order, with settings from available:
 * - serviceProfessionalOnly:boolean Whether is display to professional users only
 * - jobTitleSpecific:boolean Whether the step needs a jobTitleID in order to work,
 * and accepts that as the first URL segment
 */
var STEPS = {
    welcome: {
        userFlags: ['isClient', 'isServiceProfessional']
    },
    publicContactInfo: {
        userFlags: ['isClient', 'isServiceProfessional']
    },
    addJobTitle: {
        userFlags: ['isServiceProfessional']
    },
    serviceAddresses: {
        userFlags: ['isServiceProfessional'],
        jobTitleSpecific: true
    }
};
var PROFESSIONAL_FINISH_STEP = 'listingEditor';
var CLIENT_FINISH_STEP = 'home';

function getUserSteps(user) {
    return Object.keys(STEPS)
    .filter(function(stepName) {
        const step = STEPS[stepName];
        return !!step.userFlags.some((flag) => user[flag]());
    });
}

function OnboardingProgress(values) {
    var stepNumberFinished = -1;

    Model(this);

    this.model.defProperties({
        isServiceProfessional: false,
        stepNumber: stepNumberFinished,
        // Let's set a job title to pass in to jobTitleSpecific steps as URL segment
        selectedJobTitleID: null
    }, values);

    this.stepNames = ko.pureComputed(function() {
        return getUserSteps(this);
    }, this);
    /**
     * Gives the name of the step (activity) that should be navigated after finishing
     * the onboarding.
     * @member {KnockoutComputed<string>}
     */
    this.stepAfterFinish = ko.pureComputed(function() {
        return this.isServiceProfessional() ? PROFESSIONAL_FINISH_STEP : CLIENT_FINISH_STEP;
    }, this);

    this.totalSteps = ko.pureComputed(function() {
        // 'Zero' step is a welcome, not accounted:
        return this.stepNames().length - 1;
    }, this);

    this.incrementStep = function() {
        var currentStep = this.stepNumber();

        if(this.isFinished()) {
            return;
        }
        else if(currentStep == (this.stepNames().length - 1)){
            this.finish();
        }
        else {
            this.stepNumber(currentStep + 1);
        }
    };

    this.stepAfter = function(stepName) {
        var nextStep = new OnboardingProgress({
            selectedJobTitleID: this.selectedJobTitleID(),
            isServiceProfessional: this.isServiceProfessional()
        });
        nextStep.setStepByName(stepName);
        nextStep.incrementStep();

        return nextStep;
    };

    this.stepName = ko.pureComputed(function() {
        return this.stepNames()[this.stepNumber()] || null;
    }, this);

    this.stepUrl = ko.pureComputed(function() {
        var name = this.stepName();
        if (!name) return null;
        var url = '/' + name;

        // Check if there is need for a jobTitleID in the URL
        var def = STEPS[name];
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
    var stepIndex = this.stepNames().indexOf(name);
    if (stepIndex > -1) {
        this.stepNumber(stepIndex);
        return true;
    }
    return false;
};
