import { getDailyProblems, saveDailyProblems } from '@/lib/db';
import { generateNewProblemSet } from '@/lib/generate';
import { Selection } from '@/components/selection';

export const SelectionWrapper = async () => {
    const today = new Date().toISOString().split('T')[0];
    let stored = await getDailyProblems();

    if (!stored || stored.lastUpdate !== today) {
        console.log('Generating new problem set for', today);
        const newSet = await generateNewProblemSet(stored?.problemSet || null);

        if (newSet) {
            await saveDailyProblems(newSet);
            stored = { lastUpdate: today, problemSet: newSet };
            console.log('New problems generated successfully');
        } else {
            console.error('Failed to generate new problems, using fallback');
            if (!stored) {
                const { problemSet: initialProblemSet } = await import('@/lib/lib');
                stored = { lastUpdate: today, problemSet: initialProblemSet };
                await saveDailyProblems(initialProblemSet);
            }
        }
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return <Selection currentDate={currentDate} dailyProblems={stored!.problemSet} />;
};
