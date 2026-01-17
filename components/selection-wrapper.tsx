import { getDailyProblems, saveDailyProblems } from '@/lib/db';
import { generateNewProblemSet } from '@/lib/generate';
import { Selection } from '@/components/selection';

export const SelectionWrapper = async () => {
    const today = new Date().toISOString().split('T')[0];
    let stored = await getDailyProblems();

    if (!stored || stored.lastUpdate !== today) {
        const newSet = await generateNewProblemSet(stored?.problemSet || null);

        if (newSet) {
            await saveDailyProblems(newSet);
            stored = { lastUpdate: today, problemSet: newSet };
        } else {
            await new Promise((res) => setTimeout(res, 2000));
            stored = await getDailyProblems();
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
