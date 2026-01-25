import { getDailyProblems } from '@/lib/db';
import { generateNewProblemSet } from '@/lib/generate';
import { saveDailyProblems } from '@/lib/db';
import { DailyProblems } from '@/lib/types';

const generateDailyProblems = async (): Promise<void> => {
    try {
        console.log('--- Starting Daily Problem Generation ---');

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
            console.error('Failed to generate new problem set after retries.');
            process.exit(1);
        }

        console.log('Saving to disk...');
        await saveDailyProblems(newSet);

        console.log('Success! Daily problems generated.');
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

generateDailyProblems();
