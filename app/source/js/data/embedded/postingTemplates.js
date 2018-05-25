/**
 * Raw data for content embedded in the app with the set of posting templates
 * indexed by ID.
 * The scheme is rest.PostingTemplate
 */
export default {
    1: {
        postingTemplateID: 1,
        name: 'Default',
        createdDate: '2018-23-02',
        updatedDate: '2018-05-24',
        modifiedBy: 'ils',
        questions: [{
            // posting question details
            questionID: 1,
            legend: 'General Project Info',
            branchLogic: {},
            // Question definition
            questionTypeID: 1,
            question: 'Where are you in the lifecycle of the project?',
            options: [{
                optionID: 1,
                option: 'I have designs'
            }, {
                optionID: 2,
                option: 'I have specifications'
            }, {
                optionID: 3,
                option: 'I have ideas'
            }, {
                optionID: 4,
                option: 'I\'m just starting'
            }, {
                optionID: 5,
                option: 'Other',
                inputType: 'text'
            }]
        }]
    }
};
