import { generateNewProblemSet } from '../lib/generate';
import { getDailyProblems, saveDailyProblems } from '../lib/db';
import { DailyProblems } from '../lib/types';

const generateDailyProblems = async (): Promise<void> => {
    try {
        console.log('Starting daily problem generation...');

        const today = new Date().toISOString().split('T')[0];
        console.log(`Today: ${today}`);

        const stored = await getDailyProblems();
        console.log(`Last update: ${stored?.lastUpdate || 'Never'}`);

        if (stored && stored.lastUpdate === today) {
            console.log('Problems already updated for today! ');
            return;
        }

        console.log('Generating new problem set with AI...');
        const newSet: DailyProblems | null = await generateNewProblemSet(stored?.problemSet || null);

        if (!newSet) {
            console.error('Failed to generate new problem set');
            process.exit(1);
        }

        console.log('Saving new problems.. .');
        await saveDailyProblems(newSet);
        console.log('Daily problems generated successfully! ');

        const totalProblems = Object.values(newSet).reduce((acc, category) => {
            return acc + Object.keys(category).length;
        }, 0);

        console.log(`Generated ${totalProblems} problems across ${Object.keys(newSet).length} categories`);
    } catch (error) {
        console.error('Error generating daily problems:', error);
        process.exit(1);
    }
};

generateDailyProblems();
