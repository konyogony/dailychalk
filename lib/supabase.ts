import { DifficultyLevel, Problem, ProblemType, diffMap, typeMap } from './types';

const SUPABASE_BASE_URL = 'https://btulehndzikuesmrzmhd.supabase.co/rest/v1';

// This is the Supabase anon (public) key – safe to include server-side.
// Override via SUPABASE_ANON_KEY environment variable if needed.
const SUPABASE_KEY =
    process.env.SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dWxlaG5kemlrdWVzbXJ6bWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTEyNjcsImV4cCI6MjA3MzU2NzI2N30.jMxq5_046HHhE_p6BYCHeh_Oj0tUl5TSHQtI2tXGgBE';

const TABLE_MAP: Record<string, string> = {
    Integration: 'daily_integrals',
    Differentiation: 'daily_derivatives',
    Limits: 'daily_limits',
};

interface PuzzleData {
    day?: number;
    slug?: string;
    title?: string;
    latex?: string;
    difficulty?: string;
    hints?: string[];
    solutionMarkdown?: string;
    answerPretty?: string;
    acceptedKeySequences?: string[][];
    topicsCovered?: string[];
    funFact?: string;
}

interface SupabaseRow {
    day: number;
    difficulty: string;
    puzzle_data: PuzzleData;
}

const supabaseHeaders = {
    Authorization: `Bearer ${SUPABASE_KEY}`,
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
};

/**
 * Returns the current day-of-year (1–366), used as the `day` key in Supabase.
 */
export const getDayOfYear = (): number => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - yearStart.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

/**
 * Fetch one problem row from Supabase.
 *
 * For Integration / Differentiation the difficulty column stores EASY / MEDIUM / HARD.
 * For Limits the column may store EASY/MEDIUM/HARD **or** the legacy value LIMIT.
 * We try the standard value first and fall back to LIMIT for the Limits table.
 */
export const fetchProblemFromSupabase = async (
    category: ProblemType,
    difficulty: DifficultyLevel,
    day: number,
): Promise<SupabaseRow | null> => {
    const table = TABLE_MAP[category];
    if (!table) return null;

    const tryFetch = async (diffParam: string): Promise<SupabaseRow | null> => {
        const url =
            `${SUPABASE_BASE_URL}/${table}` +
            `?select=day%2Cdifficulty%2Cpuzzle_data` +
            `&difficulty=eq.${encodeURIComponent(diffParam)}` +
            `&day=eq.${day}`;

        const res = await fetch(url, { headers: supabaseHeaders });
        if (!res.ok) {
            console.error(`Supabase ${res.status}: ${table} difficulty=${diffParam} day=${day}`);
            return null;
        }
        const rows = (await res.json()) as SupabaseRow[];
        return rows.length > 0 ? rows[0] : null;
    };

    // Standard EASY / MEDIUM / HARD lookup
    const row = await tryFetch(difficulty.toUpperCase());
    if (row) return row;

    // Limits legacy fallback: the difficulty column might store "LIMIT"
    if (category === 'Limits') {
        const fallback = await tryFetch('LIMIT');
        if (fallback) return fallback;
    }

    return null;
};

/**
 * Map a Supabase row + puzzle_data into the app's Problem domain model.
 */
export const mapPuzzleDataToProblem = (
    row: SupabaseRow,
    category: ProblemType,
    difficulty: DifficultyLevel,
    day: number,
): Problem => {
    const pd = row.puzzle_data;

    const typePrefix = Object.keys(typeMap).find((k) => typeMap[k] === category) ?? 'int';
    const diffPrefix = Object.keys(diffMap).find((k) => diffMap[k] === difficulty) ?? 'e';

    // Build the accepted answers list from answerPretty + acceptedKeySequences (deduplicated)
    const answersSet = new Set<string>();
    if (pd.answerPretty) answersSet.add(pd.answerPretty);
    if (pd.acceptedKeySequences) {
        for (const seq of pd.acceptedKeySequences) {
            const joined = seq.join('');
            if (joined) answersSet.add(joined);
        }
    }
    const possibleAnswers = Array.from(answersSet);

    return {
        id: `${typePrefix}-${diffPrefix}-${day}`,
        date: new Date().toISOString(),
        problemLatex: pd.latex ?? pd.title ?? 'Problem unavailable.',
        possibleAnswers: possibleAnswers.length > 0 ? possibleAnswers : ['?'],
        acceptedKeySequences: pd.acceptedKeySequences ?? [],
        fullSolutionLatex: pd.solutionMarkdown ?? 'Solution unavailable.',
        hintsLatex: pd.hints ?? [],
        topicsCovered: pd.topicsCovered ?? [pd.title ?? category],
        difficultyLevel: difficulty,
        problemType: category,
        funFact: pd.funFact,
    };
};
