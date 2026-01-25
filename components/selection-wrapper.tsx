import { getDailyProblems } from '@/lib/db';
import { Selection } from '@/components/selection';

export const SelectionWrapper = async () => {
    const stored = await getDailyProblems();

    if (!stored) {
        return (
            <span className='text-sm sm:text-base text-muted-foreground mb-8 border-b border-neutral-400/50'>
                No problems available. Please check back later.
            </span>
        );
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return <Selection currentDate={currentDate} dailyProblems={stored!.problemSet} />;
};
