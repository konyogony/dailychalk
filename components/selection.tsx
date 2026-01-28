'use client';
import { DailyProblems, DifficultyLevel, difficultyArray, problemArray } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';

interface SelectionProps {
    currentDate: string;
    dailyProblems: DailyProblems;
}

const difficultyClasses: Record<DifficultyLevel, string> = {
    Hard: 'bg-red-400 text-background',
    Medium: 'bg-amber-400 text-background',
    Easy: 'bg-emerald-400 text-background',
};

export const Selection = ({ currentDate, dailyProblems }: SelectionProps) => {
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    useEffect(() => {
        const cachedDifficulty = localStorage.getItem('chalk-selected-difficulty');
        const cachedCompleted = localStorage.getItem('chalk-completed-ids');

        if (cachedDifficulty) {
            setSelectedDifficulty(cachedDifficulty as DifficultyLevel);
        }
        if (cachedCompleted) {
            try {
                setCompletedIds(JSON.parse(cachedCompleted));
            } catch (e) {
                console.error('Failed to parse completed IDs', e);
            }
        }

        Object.entries(dailyProblems).map(([category, difficulties]: [string, any]) => {
            if (!difficulties.Medium) {
                console.error(`CRITICAL: Category "${category}" is missing Medium difficulty!`, difficulties);
            }
        });
    }, [dailyProblems]);

    const handleDifficultyChange = (d: DifficultyLevel) => {
        setSelectedDifficulty(d);
        localStorage.setItem('chalk-selected-difficulty', d);
    };

    return (
        <div className='min-h-screen w-full items-center flex flex-col py-4'>
            <div className='flex flex-col max-w-xl mx-auto w-full px-4 py-12 sm:py-24 items-center'>
                <span className='text-base sm:text-lg text-primary uppercase mb-1'>Daily Chalk</span>
                <span className='text-sm sm:text-base text-muted-foreground mb-8 border-b border-neutral-400/50'>
                    {currentDate}
                </span>

                <div className='flex flex-col gap-2 w-full items-center mb-4'>
                    <span className='text-muted-foreground text-sm uppercase tracking-wider w-fit'>difficulty</span>
                    <div className='flex gap-2 sm:gap-3 w-full'>
                        {difficultyArray.map((d) => (
                            <button
                                key={d}
                                onClick={() => handleDifficultyChange(d)}
                                className={cn(
                                    'px-2 py-2.5 text-xs sm:text-sm border border-border rounded transition-all flex-1',
                                    selectedDifficulty === d ? difficultyClasses[d] : 'hover:bg-accent',
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className={cn(
                        'flex flex-col gap-2 w-full items-center transition-all',
                        selectedDifficulty ? 'opacity-100' : 'opacity-0 pointer-events-none',
                    )}
                >
                    <span className='text-muted-foreground text-sm uppercase tracking-wider w-fit'>problem type</span>
                    <div className='grid grid-cols-1 sm:grid-cols-2 w-full gap-2 sm:gap-3'>
                        {selectedDifficulty &&
                            problemArray.map((t, i) => {
                                const problemId = dailyProblems[t][selectedDifficulty].id;
                                const completed = completedIds.includes(problemId);

                                const isLast = i === problemArray.length - 1;
                                const isOddCount = problemArray.length % 2 === 1;
                                return (
                                    <Link
                                        key={i}
                                        href={problemId}
                                        className={cn(
                                            'group px-4 py-3 sm:py-2 text-sm border border-border rounded transition-colors flex items-center min-h-11',
                                            completed && 'bg-accent',
                                            isLast && isOddCount && 'sm:col-span-2',
                                        )}
                                    >
                                        {t}
                                        {completed ? (
                                            <span className='font-bold ml-auto text-xs uppercase'>completed</span>
                                        ) : (
                                            <IconArrowRight
                                                className='ml-auto opacity-40 sm:opacity-0 sm:group-hover:opacity-100 transition-all'
                                                size={16}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            </div>
            <div className='mt-auto p-6 flex justify-center gap-6 items-center text-muted-foreground text-[10px] uppercase tracking-tighter'>
                <a href='https://github.com/konyogony/dailychalk/' className='hover:text-foreground transition-colors'>
                    GitHub
                </a>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className='cursor-pointer hover:text-red-400 transition-colors'
                >
                    Reset Cache
                </button>
            </div>
        </div>
    );
};
