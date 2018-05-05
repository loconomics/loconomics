DELETE from JobTitleSolution where solutionID NOT IN (SELECT solutionID from solution)
