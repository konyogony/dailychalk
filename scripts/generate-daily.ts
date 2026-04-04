import { getDailyProblems, saveDailyProblems } from '../lib/db';
import { generateNewProblemSet } from '../lib/generate';

const generateDailyProblems = async (): Promise<void> => {
    try {
        console.log('--- Starting Daily Problem Fetch ---');

        const today = new Date().toISOString().split('T')[0];
        console.log(`Date Target: ${today}`);

        const stored = await getDailyProblems();

        if (stored && stored.lastUpdate === today) {
            console.log('Problems already exist for today. Skipping fetch.');
            return;
        }

        console.log('Fetching from Supabase...');
        const newSet = await generateNewProblemSet();

        if (!newSet) {
            console.error('Failed to fetch problem set after all retries.');
            process.exit(1);
        }

        console.log('Saving to disk...');
        await saveDailyProblems(newSet);

        console.log('Success! Daily problems fetched and saved.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Fatal Error:', error.message);
            console.error('Stack trace:', error.stack);
        } else {
            console.error('Fatal Error (Unknown type):', error);
        }
        process.exit(1);
    }
};

generateDailyProblems();
