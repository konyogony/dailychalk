'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Latex from 'react-latex-next';
import type { Problem } from '@/lib/types';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

const MAX_TRIES = 3;
const STORAGE_KEY = 'chalk-completed-ids';

export const Client = ({ problem }: { problem: Problem }) => {
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [showSolution, setShowSolution] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [triesLeft, setTriesLeft] = useState(MAX_TRIES);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setAnswer('');
        setResult(null);
        setShowSolution(false);
        setHintsUsed(0);
        setTriesLeft(MAX_TRIES);
        setIsFinished(false);

        const checkCompletion = () => {
            const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (completed.includes(problem.id)) {
                setIsFinished(true);
                setShowSolution(true);
                setTriesLeft(0);
                setHintsUsed(problem.hintsLatex.length);
            }
        };
        checkCompletion();
    }, [problem.id, problem.hintsLatex.length]);

    const completeProblem = useCallback(
        (status: 'correct' | 'failed') => {
            setIsFinished(true);
            setShowSolution(true);
            if (status === 'correct') {
                setResult('correct');
            }

            const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!completed.includes(problem.id)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed, problem.id]));
            }
        },
        [problem.id],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFinished) return;

        const isCorrect = problem.possibleAnswers.some(
            (a) => a.toLowerCase().trim().replaceAll(' ', '') === answer.toLowerCase().trim().replaceAll(' ', ''),
        );

        if (isCorrect) {
            completeProblem('correct');
        } else {
            const newTries = triesLeft - 1;
            setTriesLeft(newTries);
            setResult('incorrect');

            if (newTries <= 0) {
                completeProblem('failed');
            }
        }
    };

    const handleUseHint = () => {
        const nextHints = hintsUsed + 1;
        setHintsUsed(nextHints);

        if (nextHints >= totalHints) {
            completeProblem('failed');
        }
    };

    const handleGiveUp = () => {
        completeProblem('failed');
    };

    const totalHints = problem.hintsLatex.length;
    const currentBlur = showSolution ? 0 : totalHints > 0 ? Math.max(0, 12 * (1 - hintsUsed / totalHints)) : 12;

    return (
        <div className='flex flex-col gap-6 w-full max-w-full overflow-hidden'>
            <div className='flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest'>
                <span className='text-primary font-bold'>{problem.problemType}</span>
                <span>·</span>
                <span>{problem.difficultyLevel}</span>
                <span>·</span>
                <span>#{problem.id.split('-')[2]}</span>
                <span className='truncate text-[9.5px]'>{problem.topicsCovered.join(', ')}</span>
            </div>

            <div className='border border-border rounded-xl p-6 sm:p-8 w-full bg-card shadow-sm overflow-x-auto'>
                <div className='min-w-fit text-lg latex-container'>
                    <Latex>{problem.problemLatex}</Latex>
                </div>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
                <div className='flex items-center justify-between'>
                    <label className='text-[10px] text-muted-foreground uppercase tracking-wider font-bold'>
                        your answer
                    </label>
                    <div className='flex items-center gap-1.5'>
                        {Array.from({ length: MAX_TRIES }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'w-2.5 h-2.5 rounded-full transition-all duration-300',
                                    i < triesLeft ? 'bg-primary' : 'bg-muted-foreground/20',
                                )}
                            />
                        ))}
                    </div>
                </div>

                <input
                    type='text'
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={isFinished ? 'Problem closed' : 'e.g. x^2 + C'}
                    className={cn(
                        'w-full scale-[99%] px-4 py-3 bg-secondary/50 border border-border rounded-lg text-sm transition-all focus:outline-none focus:ring-2',
                        result === 'correct' ? 'ring-emerald-500/50 border-emerald-500' : 'focus:ring-primary/20',
                        isFinished && 'opacity-60 cursor-not-allowed',
                    )}
                    disabled={isFinished}
                />

                {result === 'incorrect' && !isFinished && (
                    <div className='flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300'>
                        <span className='text-red-400 text-sm font-medium'>
                            Incorrect — {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} remaining
                        </span>
                    </div>
                )}

                {isFinished && result !== 'correct' && (
                    <div className='flex items-center justify-center gap-2 px-4 py-2.5 bg-muted/50 border border-border rounded-lg animate-in fade-in duration-300'>
                        <span className='text-muted-foreground text-sm font-medium'>
                            Problem finished — solution revealed
                        </span>
                    </div>
                )}

                <div className='flex gap-2'>
                    <button
                        type='submit'
                        disabled={!answer.trim() || isFinished}
                        className='flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50'
                    >
                        {result === 'correct' ? 'Solved' : 'Submit Answer'}
                    </button>

                    {!isFinished && (
                        <button
                            type='button'
                            onClick={handleGiveUp}
                            className='px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors'
                        >
                            Give Up
                        </button>
                    )}
                </div>
            </form>

            <div className='flex flex-col gap-3 w-full border-t border-border pt-6'>
                <div className='flex items-center justify-between'>
                    <span className='text-[10px] text-muted-foreground uppercase tracking-wider font-bold'>
                        Hints ({hintsUsed}/{totalHints})
                    </span>
                    <button
                        type='button'
                        onClick={handleUseHint}
                        disabled={hintsUsed >= totalHints || isFinished}
                        className='text-xs font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer'
                    >
                        + Use hint
                    </button>
                </div>

                <div className='flex flex-col gap-2'>
                    {problem.hintsLatex.slice(0, hintsUsed).map((hint, i) => (
                        <div
                            key={i}
                            className='text-sm bg-secondary/30 px-4 py-3 rounded-lg border border-border/50 overflow-x-auto animate-in slide-in-from-top-2 duration-300'
                        >
                            <Latex>{hint}</Latex>
                        </div>
                    ))}
                </div>
            </div>

            <div className='flex flex-col gap-2 w-full mb-12'>
                <span className='text-[10px] text-muted-foreground uppercase tracking-wider font-bold'>
                    full solution
                </span>
                <div className='relative border border-border rounded-xl p-6 transition-all duration-700 bg-secondary/5 overflow-hidden'>
                    <div
                        style={{ filter: `blur(${currentBlur}px)` }}
                        className='transition-all duration-700 overflow-x-auto overflow-y-clip'
                    >
                        <div className='min-w-fit'>
                            <Latex>{problem.fullSolutionLatex}</Latex>
                        </div>
                    </div>

                    {!showSolution && currentBlur > 0 && (
                        <div className='absolute inset-0 flex items-center justify-center bg-background/5'>
                            <div className='bg-background/90 px-4 py-1.5 rounded-full border border-border shadow-xl backdrop-blur-sm'>
                                <span className='text-[10px] font-bold text-foreground uppercase tracking-tight'>
                                    {totalHints - hintsUsed > 0
                                        ? `${totalHints - hintsUsed} more hint${totalHints - hintsUsed === 1 ? '' : 's'} to reveal`
                                        : 'Submit or Give Up to reveal solution'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
