import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyProblems, Problem, diffMap, typeMap } from './types';
import { THEMES } from './themes';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateNewProblemSet = async (previousSet: DailyProblems | null): Promise<DailyProblems | null> => {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            console.log(`AI Generation Attempt ${attempts + 1}...`);

            const { lastIndices, bannedTopics } = getContext(previousSet);

            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5',
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.8,
                },
            });

            const prompt = `
            Act as an enthusiastic Mathematics Professor for CIE A-Level (9709) and Further Maths (9231).
            Create a daily challenge set of 12 problems (4 Categories x 3 Difficulties).

            ### CATEGORIES & THEMES:
            1. Integration: Choose from [${THEMES.Integration.join(', ')}]
            2. Differentiation: Choose from [${THEMES.Differentiation.join(', ')}]
            3. Mathematics (9709): Choose from [${THEMES['Mathematics (9709)'].join(', ')}]
            4. Further Math (9231): Choose from [${THEMES['Further Math (9231)'].join(', ')}]

            ### IMPORTANT - AVOID REPETITION:
            Do NOT generate questions exactly matching these recent topics: ${JSON.stringify(bannedTopics.slice(0, 15))}.

            ### DATA STRUCTURE (JSON ONLY):
            Return a single object. Keys are Category Names. Inside each, keys are "Easy", "Medium", "Hard".
            
            Each Problem Object must have:
            - "problemLatex": The question string (Use double backslash for latex: \\\\int, \\\\frac).
            - "possibleAnswers": ARRAY of STRINGS. **CRITICAL**: The user types the answer. You must provide ALL valid variations. 
               Example if answer is 1/2: ["1/2", "0.5", "50%", "1 over 2", "0.50"]
               Example if answer is 4pi: ["4pi", "4\\pi", "4 pi", "12.57"]
            - "fullSolutionLatex": Step-by-step solution.
            - "hintsLatex": Array of 3 strings.
            - "topicsCovered": Array of strings (The specific theme used).
            - "funFact": A one-sentence interesting fact related to the math concept or its real-world usage.

            ### DIFFICULTY GUIDE:
            - Easy: Direct application of formula.
            - Medium: Requires 2-3 steps or combining two concepts.
            - Hard: Word problem, real-world scenario, or requires 'trick' / obscure identity.

            ### LATEX RULES:
            ALWAYS use double backslashes (\\\\) for LaTeX commands.
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const jsonString = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            const rawData = JSON.parse(jsonString);

            const finalSet = processAIResponse(rawData, lastIndices);
            return finalSet;
        } catch (e) {
            console.error(`Generation attempt ${attempts + 1} failed:`, e);
            attempts++;
        }
    }
    return null;
};

const processAIResponse = (rawData: any, lastIndices: Record<string, number>): DailyProblems => {
    const newSet: Partial<DailyProblems> = {};
    const categories = ['Integration', 'Differentiation', 'Further Math (9231)', 'Mathematics (9709)'] as const;
    const difficulties = ['Easy', 'Medium', 'Hard'] as const;
    const today = new Date().toISOString();

    categories.forEach((cat) => {
        const aiCatKey =
            Object.keys(rawData).find((k) => k.toLowerCase().includes(cat.toLowerCase().split(' ')[0])) || cat;
        const catData = rawData[aiCatKey];

        newSet[cat] = {} as any;

        difficulties.forEach((diff) => {
            const aiDiffKey = catData ? Object.keys(catData).find((k) => k.toLowerCase() === diff.toLowerCase()) : null;
            const rawProb = catData && aiDiffKey ? catData[aiDiffKey] : {};

            const typePrefix = Object.keys(typeMap).find((key) => typeMap[key] === cat) || 'math';
            const diffPrefix = Object.keys(diffMap).find((key) => diffMap[key] === diff) || 'e';
            const baseId = `${typePrefix}-${diffPrefix}`;

            const newIndex = (lastIndices[baseId] || 0) + 1;
            lastIndices[baseId] = newIndex;

            // 2. BUILD OBJECT
            const problem: Problem = {
                id: `${baseId}-${newIndex}`,
                date: today,
                problemLatex: rawProb.problemLatex || 'Error generating problem.',
                possibleAnswers: Array.isArray(rawProb.possibleAnswers) ? rawProb.possibleAnswers : ['Error'],
                fullSolutionLatex: rawProb.fullSolutionLatex || 'Solution unavailable.',
                hintsLatex: rawProb.hintsLatex || [],
                topicsCovered: rawProb.topicsCovered || [cat],
                difficultyLevel: diff,
                problemType: cat,
                funFact: rawProb.funFact || 'Math is fun!',
            };

            // @ts-expect-error Man who cares about types and safety atp
            newSet[cat][diff] = problem;
        });
    });

    return newSet as DailyProblems;
};

const getContext = (previousSet: DailyProblems | null) => {
    const lastIndices: Record<string, number> = {};
    const bannedTopics: Set<string> = new Set();

    if (!previousSet) return { lastIndices, bannedTopics: [] };

    Object.values(previousSet).forEach((category) => {
        Object.values(category).forEach((prob) => {
            const parts = prob.id.split('-');
            const num = parseInt(parts[parts.length - 1]);
            const base = parts.slice(0, -1).join('-');

            if (!isNaN(num)) {
                if (!lastIndices[base] || num > lastIndices[base]) {
                    lastIndices[base] = num;
                }
            }

            if (prob.topicsCovered) {
                prob.topicsCovered.forEach((t) => bannedTopics.add(t));
            }
        });
    });

    return {
        lastIndices,
        bannedTopics: Array.from(bannedTopics),
    };
};
