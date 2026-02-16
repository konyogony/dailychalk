import { getDailyProblems } from '@/lib/db';
import { generateNewProblemSet } from '@/lib/generate';
import { saveDailyProblems } from '@/lib/db';
import { DailyProblems } from '@/lib/types';

const generateDailyProblems = async (): Promise<void> => {
    try {
        console.log('--- Starting Daily Problem Generation ---');

        // Validate API key early
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ ERROR: GEMINI_API_KEY environment variable is not set');
            console.error('Please set the GEMINI_API_KEY environment variable before running this script.');
            process.exit(1);
        }

        const today = new Date().toISOString().split('T')[0];
        console.log(`Date Target: ${today}`);

        const stored = await getDailyProblems();

        if (stored && stored.lastUpdate === today) {
            console.log('✅ Problems already exist for today. Skipping generation.');
            return;
        }

        console.log('Querying Gemini AI...');
        const newSet: DailyProblems | null = await generateNewProblemSet(stored?.problemSet || null);

        if (!newSet) {
            console.error('❌ Failed to generate new problem set after all retries.');
            console.error('Check the logs above for specific error details.');
            process.exit(1);
        }

        console.log('Saving to disk...');
        await saveDailyProblems(newSet);

        console.log('✅ Success! Daily problems generated and saved.');
    } catch (error) {
        // Distinguish between different error types
        if (error instanceof Error) {
            if (error.message.includes('ENOENT') || error.message.includes('file')) {
                console.error('❌ File System Error:', error.message);
                console.error('Unable to read or write problem data files.');
            } else if (error.message.includes('JSON')) {
                console.error('❌ JSON Parsing Error:', error.message);
                console.error('The AI response was not valid JSON.');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                console.error('❌ Network Error:', error.message);
                console.error('Unable to connect to Gemini API.');
            } else {
                console.error('❌ Fatal Error:', error.message);
                console.error('Stack trace:', error.stack);
            }
        } else {
            console.error('❌ Fatal Error (Unknown type):', error);
        }
        process.exit(1);
    }
};

generateDailyProblems();
