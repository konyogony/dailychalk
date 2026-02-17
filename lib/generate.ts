import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';
import { getAllValidTopics } from './utils';
import { DailyProblems, Problem, diffMap, difficultyArray, problemArray, typeMap } from './types';
import { THEMES } from './themes';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateNewProblemSet = async (previousSet: DailyProblems | null): Promise<DailyProblems | null> => {
    // Validate API key exists
    if (!process.env.GEMINI_API_KEY) {
        console.error('ERROR: GEMINI_API_KEY environment variable is not set');
        return null;
    }

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            console.log(`AI Generation Attempt ${attempts + 1} of ${maxAttempts}...`);

            const { lastIndices, bannedTopics } = getContext(previousSet);

            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.8,
                },
            });

            const prompt = `
            Act as an enthusiastic Mathematics Professor for CIE A-Level (9709) and Further Maths (9231).
            Create a daily challenge set of 18 problems (6 Categories x 3 Difficulties).

            ### CATEGORIES & THEMES:
            1. Integration: Choose from [${THEMES.Integration.join(', ')}]
            2. Differentiation: Choose from [${THEMES.Differentiation.join(', ')}]
            3. Mathematics (9709): Choose from [${THEMES['Mathematics (9709)'].join(', ')}]
            4. Further Math (9231): Choose from [${THEMES['Further Math (9231)'].join(', ')}]
            5. Further Mechanics (9231): Choose from [${THEMES['Further Mechanics (9231)'].join(', ')}]
            6. Mechanics (9701): Choose from [${THEMES['Mechanics (9701)'].join(', ')}]

            ### IMPORTANT - AVOID REPETITION:
            Do NOT generate questions exactly matching these recent topics: ${JSON.stringify(bannedTopics.slice(0, 15))}.

            ### DATA STRUCTURE (JSON ONLY):
            **CRITICAL: You must return ONLY valid JSON, no markdown code blocks, no explanations, no extra text.**
            
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

            ### EXAMPLE FORMAT:
            {
              "Integration": {
                "Easy": {
                  "problemLatex": "Find \\\\int 2x \\\\, dx",
                  "possibleAnswers": ["x^2 + C", "x^2+C", "x squared plus C"],
                  "fullSolutionLatex": "Step 1: Apply power rule...",
                  "hintsLatex": ["Remember the power rule", "Don't forget +C", "Increase power by 1"],
                  "topicsCovered": ["Basic Integration"],
                  "funFact": "Integration was invented independently by Newton and Leibniz."
                }
              }
            }

            **REMINDER: All 6 categories required, each with Easy/Medium/Hard. Return ONLY valid JSON.**
            `;

            // Set a timeout for the API call (90 seconds to handle slow responses)
            const apiCallPromise = model.generateContent(prompt);
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('API call timeout after 90 seconds')), 90000)
            );

            const result = (await Promise.race([
                apiCallPromise,
                timeoutPromise,
            ])) as GenerateContentResult;
            const text = result.response.text();

            // Clean and parse JSON with better error handling
            const jsonString = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            let rawData;
            try {
                rawData = JSON.parse(jsonString);
            } catch (parseError) {
                const preview = jsonString.length > 200 ? jsonString.slice(0, 200) + '...' : jsonString;
                throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Raw response: ${preview}`);
            }

            // Validate the structure
            if (!rawData || typeof rawData !== 'object') {
                throw new Error('Invalid response structure: Expected an object');
            }

            const finalSet = processAIResponse(rawData, lastIndices);
            console.log('✅ Successfully generated problem set');
            return finalSet;
        } catch (e) {
            const errorType = e instanceof Error ? e.constructor.name : 'Unknown';
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(`❌ Generation attempt ${attempts + 1} failed [${errorType}]: ${errorMessage}`);
            
            attempts++;
            
            // Exponential backoff with cap: 5s, 10s, 20s, 30s (4 delays between 5 attempts)
            if (attempts < maxAttempts) {
                const backoffMs = Math.min(Math.pow(2, attempts) * 2500, 30000); // 2^1*2.5=5s, 2^2*2.5=10s, 2^3*2.5=20s, max 30s
                console.log(`⏳ Waiting ${backoffMs / 1000}s before retry...`);
                await delay(backoffMs);
            }
        }
    }
    console.error(`❌ All ${maxAttempts} generation attempts failed`);
    return null;
};

const processAIResponse = (rawData: any, lastIndices: Record<string, number>): DailyProblems => {
    const newSet: Partial<DailyProblems> = {};
    const today = new Date().toISOString();

    problemArray.forEach((cat) => {
        const aiCatKey =
            Object.keys(rawData).find((k) => k.toLowerCase().trim() === cat.toLowerCase().trim()) ??
            Object.keys(rawData).find((k) => k.toLowerCase().includes(cat.toLowerCase().split(' ')[0]));
        const catData = aiCatKey ? rawData[aiCatKey] : null;

        newSet[cat] = {} as any;

        difficultyArray.forEach((diff) => {
            const aiDiffKey = catData ? Object.keys(catData).find((k) => k.toLowerCase() === diff.toLowerCase()) : null;
            const rawProb = catData && aiDiffKey ? catData[aiDiffKey] : {};

            const typePrefix = Object.keys(typeMap).find((key) => typeMap[key] === cat) || 'math';
            const diffPrefix = Object.keys(diffMap).find((key) => diffMap[key] === diff) || 'e';
            const baseId = `${typePrefix}-${diffPrefix}`;

            const newIndex = (lastIndices[baseId] || 0) + 1;
            lastIndices[baseId] = newIndex;

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
    const validTopics = getAllValidTopics();

    if (!previousSet) return { lastIndices, bannedTopics: [] };

    Object.values(previousSet).forEach((category) => {
        Object.values(category).forEach((prob) => {
            const parts = prob.id.split('-');
            const num = parseInt(parts[parts.length - 1]);
            const base = parts.slice(0, -1).join('-');

            if (!isNaN(num)) {
                lastIndices[base] = Math.max(lastIndices[base] || 0, num);
            }

            if (Array.isArray(prob.topicsCovered)) {
                prob.topicsCovered.forEach((t) => {
                    if (validTopics.has(t)) {
                        bannedTopics.add(t);
                    }
                });
            }
        });
    });

    return {
        lastIndices,
        bannedTopics: Array.from(bannedTopics),
    };
};
