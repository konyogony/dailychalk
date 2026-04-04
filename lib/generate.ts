import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyProblems, DifficultyLevel, Problem, ProblemType, difficultyArray, problemArray, typeMap, diffMap } from './types';
import { fetchProblemFromSupabase, getDayOfYear, mapPuzzleDataToProblem } from './supabase';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Use Gemini to produce hints + solution when the Supabase payload is missing them.
 * This is a best-effort fallback – errors are swallowed so they never block the fetch flow.
 */
const generateHintsAndSolution = async (
    problemLatex: string,
    category: string,
): Promise<{ hints: string[]; solution: string }> => {
    if (!process.env.GEMINI_API_KEY) {
        return { hints: [], solution: 'Solution unavailable.' };
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
        });

        const prompt = `Given this ${category} problem in LaTeX:
${problemLatex}

Generate exactly:
1. Three progressive hints (subtle to explicit) as LaTeX strings.
2. A full step-by-step solution using LaTeX.

Return ONLY valid JSON with this shape:
{"hints": ["hint1", "hint2", "hint3"], "solution": "step-by-step solution in LaTeX"}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsed = JSON.parse(text);
        return {
            hints: Array.isArray(parsed.hints) ? parsed.hints : [],
            solution: typeof parsed.solution === 'string' ? parsed.solution : 'Solution unavailable.',
        };
    } catch (e) {
        console.warn(`AI hints/solution generation failed: ${e instanceof Error ? e.message : e}`);
        return { hints: [], solution: 'Solution unavailable.' };
    }
};

/**
 * Build a placeholder Problem when Supabase returns no data for a slot.
 */
const makePlaceholder = (category: ProblemType, difficulty: DifficultyLevel, day: number): Problem => {
    const typePrefix = Object.keys(typeMap).find((k) => typeMap[k] === category) ?? 'int';
    const diffPrefix = Object.keys(diffMap).find((k) => diffMap[k] === difficulty) ?? 'e';
    return {
        id: `${typePrefix}-${diffPrefix}-${day}`,
        date: new Date().toISOString(),
        problemLatex: 'No problem available for today. Please check back tomorrow.',
        possibleAnswers: ['?'],
        acceptedKeySequences: [],
        fullSolutionLatex: 'Solution unavailable.',
        hintsLatex: [],
        topicsCovered: [category],
        difficultyLevel: difficulty,
        problemType: category,
    };
};

/**
 * Fetch today's problem set from Supabase (3 categories x 3 difficulties = 9 problems).
 * Hints and full solutions are taken from the puzzle_data payload; if absent they are
 * generated on-demand by Gemini AI.
 */
export const generateNewProblemSet = async (): Promise<DailyProblems | null> => {
    const day = getDayOfYear();
    console.log(`Fetching Supabase problems for day-of-year ${day}...`);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const newSet: Partial<DailyProblems> = {};

            for (const cat of problemArray) {
                newSet[cat] = {} as Record<string, Problem>;

                for (const diff of difficultyArray) {
                    console.log(`  -> ${cat} (${diff})`);
                    const row = await fetchProblemFromSupabase(cat, diff, day);

                    if (row) {
                        const problem = mapPuzzleDataToProblem(row, cat, diff, day);

                        // Fall back to AI if hints or solution are absent in the payload
                        if (
                            problem.hintsLatex.length === 0 ||
                            problem.fullSolutionLatex === 'Solution unavailable.'
                        ) {
                            console.log(`    Generating hints/solution via AI for ${cat} (${diff})...`);
                            const ai = await generateHintsAndSolution(problem.problemLatex, cat);
                            if (problem.hintsLatex.length === 0) problem.hintsLatex = ai.hints;
                            if (problem.fullSolutionLatex === 'Solution unavailable.')
                                problem.fullSolutionLatex = ai.solution;
                        }

                        (newSet[cat] as Record<string, Problem>)[diff] = problem;
                    } else {
                        console.warn(`    No Supabase data for ${cat} (${diff}) day=${day}, using placeholder`);
                        (newSet[cat] as Record<string, Problem>)[diff] = makePlaceholder(cat, diff, day);
                    }
                }
            }

            console.log('Successfully fetched problem set from Supabase');
            return newSet as DailyProblems;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`Fetch attempt ${attempts + 1} failed: ${msg}`);
            attempts++;
            if (attempts < maxAttempts) {
                const backoff = 5000 * attempts;
                console.log(`Retrying in ${backoff / 1000}s...`);
                await delay(backoff);
            }
        }
    }

    console.error(`All ${maxAttempts} fetch attempts failed`);
    return null;
};
