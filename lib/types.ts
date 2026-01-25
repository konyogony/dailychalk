export const difficultyArray = ['Hard', 'Medium', 'Easy'] as const;
export type DifficultyLevel = (typeof difficultyArray)[number];

export const typeMap: Record<string, ProblemType> = {
    int: 'Integration',
    diff: 'Differentiation',
    fm: 'Further Math (9231)',
    math: 'Mathematics (9709)',
};
export const diffMap: Record<string, DifficultyLevel> = {
    e: 'Easy',
    m: 'Medium',
    h: 'Hard',
};

export const problemArray = ['Integration', 'Differentiation', 'Further Math (9231)', 'Mathematics (9709)'];
export type ProblemType = (typeof problemArray)[number];
export type DailyProblems = Record<ProblemType, Record<DifficultyLevel, Problem>>;

export interface Problem {
    id: string;
    date: Date | string;
    problemLatex: string;
    possibleAnswers: string[];
    fullSolutionLatex: string;
    hintsLatex: string[];
    topicsCovered: string[];
    difficultyLevel: DifficultyLevel;
    problemType: ProblemType;
    funFact?: string;
}
