import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyProblems, ProblemType, problemArray, DifficultyLevel } from './types';
import { problemSet as initialProblemSet } from './lib';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateNewProblemSet = async (previousSet: DailyProblems | null): Promise<DailyProblems | null> => {
    try {
        const { lastIds, usedProblems } = getContext(previousSet);

        const exampleSchema = JSON.stringify(initialProblemSet, null, 2).slice(0, 1500);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
            },
        });

        const prompt = `
            Act as a mathematics professor for CIE A-Level (9709) and Further Maths (9231).
            Generate a JSON object with exactly 12 problems.

            ### SCHEMA REFERENCE:
            ${exampleSchema}

            ### REQUIRED DATA STRUCTURE:
            Return a nested object with categories: "Integration", "Differentiation", "Further Math (9231)", "Mathematics (9709)".
            Each category must contain "Easy", "Medium", and "Hard" objects.
            
            Each Problem object MUST have:
            - id: string (Follow ID rules below)
            - date: string (ISO format)
            - problemLatex: string (Use $$...$$)
            - possibleAnswers: string[] (Array of 4 options)
            - fullSolutionLatex: string (Detailed step-by-step)
            - hintsLatex: string[] (3-4 hints)
            - topicsCovered: string[]
            - difficultyLevel: "Easy" | "Medium" | "Hard"
            - problemType: (The category name)

            ### ID & CONTEXT RULES:
            - Previous max ID indices: ${lastIds}
            - Do not repeat these problems: ${usedProblems.slice(0, 1000)}
            - NEW ID FORMAT: "[type-prefix]-[difficulty-prefix]-[incremented-index]"
            - Example: If last index for int-e was 1, new ID is "int-e-2".

            ### CRITICAL:
            1. Use DOUBLE BACKSLASHES for all LaTeX (e.g., "\\\\int", "\\\\frac{1}{2}").
            2. Ensure possibleAnswers contains the correct answer. Make sure that the format the answer is written in contains both LaTeX and plain text and other simplified versions of the answer.
            3.5 Ensure you have at least 15 possible answers for each question, where it ranges from some latex and formatting, to none.
            3. Mathematics (9709) should cover Pure 1-3. Further Math (9231) should cover Further Pure 1-2 as well as mechanics.
            4. Make sure every day the question is completeley different, cant have similarities.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const rawData = JSON.parse(text);

        const normalized: DailyProblems = JSON.parse(JSON.stringify(initialProblemSet));

        const findCategory = (key: string): ProblemType | null => {
            const match = problemArray.find((p) => p.toLowerCase().includes(key.toLowerCase().split(' ')[0]));
            return (match as ProblemType) || null;
        };

        const sourceObj = rawData.problemSet || rawData;

        Object.keys(sourceObj).forEach((rawCatKey) => {
            const actualCat = findCategory(rawCatKey);
            if (actualCat) {
                const diffs = sourceObj[rawCatKey];
                if (Array.isArray(diffs)) {
                    diffs.forEach((p: any) => {
                        const d = (p.difficultyLevel || p.difficulty || 'Easy') as DifficultyLevel;
                        const capitalizedDiff = (d.charAt(0).toUpperCase() +
                            d.slice(1).toLowerCase()) as DifficultyLevel;
                        if (normalized[actualCat][capitalizedDiff]) {
                            normalized[actualCat][capitalizedDiff] = p;
                        }
                    });
                } else {
                    Object.keys(diffs).forEach((rawDiffKey) => {
                        const actualDiff = (rawDiffKey.charAt(0).toUpperCase() +
                            rawDiffKey.slice(1).toLowerCase()) as DifficultyLevel;
                        if (normalized[actualCat][actualDiff]) {
                            normalized[actualCat][actualDiff] = diffs[rawDiffKey];
                        }
                    });
                }
            }
        });

        return normalized;
    } catch (e) {
        console.error('Generation failed:', e);
        return null;
    }
};

const getContext = (previousSet: DailyProblems | null) => {
    if (!previousSet) return { lastIds: 'None', usedProblems: 'None' };

    const lastIds: Record<string, number> = {};
    const usedProblems: string[] = [];

    Object.values(previousSet).forEach((category) => {
        Object.values(category).forEach((prob) => {
            const parts = prob.id.split('-');
            const num = parseInt(parts[parts.length - 1]);
            const base = parts.slice(0, -1).join('-');

            if (!isNaN(num)) {
                if (!lastIds[base] || num > lastIds[base]) {
                    lastIds[base] = num;
                }
            }
            usedProblems.push(prob.problemLatex);
        });
    });

    return {
        lastIds: JSON.stringify(lastIds),
        usedProblems: usedProblems.join(' | '),
    };
};
