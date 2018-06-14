UPDATE UserPostingQuestionResponse SET label = (SELECT label FROM question WHERE question.questionID = UserPostingQuestionResponse.questionID)
