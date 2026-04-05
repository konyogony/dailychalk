'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Latex from 'react-latex-next';
import type { Problem } from '@/lib/types';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

const MAX_TRIES = 3;
const STORAGE_KEY = 'chalk-completed-ids';

/**
 * Normalise an answer string so that mathematically equivalent variants compare equal.
 *
 * Strategy:
 *  1. Strip enclosing LaTeX delimiters ($…$, \(…\), \[…\]).
 *  2. Remove LaTeX spacing commands (\, \; \: \! etc.).
 *  3. Map Unicode maths symbols to ASCII equivalents.
 *  4. Expand common LaTeX commands (\\frac, \\sqrt, \\pi, trig names, …).
 *  5. Collapse all whitespace.
 *  6. Lowercase everything.
 */
const normalizeAnswer = (raw: string): string => {
    let s = raw.trim();

    // Strip enclosing $…$ / $$…$$
    s = s.replace(/^\$\$?([\s\S]+?)\$\$?$/, '$1');
    // Strip \(…\) and \[…\]
    s = s.replace(/^\\\(([\s\S]+?)\\\)$/, '$1');
    s = s.replace(/^\\\[([\s\S]+?)\\\]$/, '$1');

    // LaTeX spacing / formatting commands
    s = s.replace(/\\[,;:! ]/g, '');
    s = s.replace(/\\quad|\\qquad/g, '');
    s = s.replace(/~|\\text\{[^}]*\}/g, '');

    // Unicode → ASCII
    s = s.replace(/\u2212/g, '-');       // unicode minus −
    s = s.replace(/[\u00D7\u22C5\u00B7]/g, '*'); // × ⋅ ·
    s = s.replace(/\u00F7/g, '/');       // ÷
    s = s.replace(/\u03C0/g, 'pi');      // π
    s = s.replace(/\u221E/g, 'infinity'); // ∞
    s = s.replace(/\u2019/g, "'");       // right single quote

    // LaTeX commands → plain equivalents
    s = s.replace(/\\pi\b/g, 'pi');
    s = s.replace(/\\infty\b/g, 'infinity');
    s = s.replace(/\\ln\b/g, 'ln');
    s = s.replace(/\\log\b/g, 'log');
    s = s.replace(/\\exp\b/g, 'exp');
    s = s.replace(/\\sin\b/g, 'sin');
    s = s.replace(/\\cos\b/g, 'cos');
    s = s.replace(/\\tan\b/g, 'tan');
    s = s.replace(/\\sec\b/g, 'sec');
    s = s.replace(/\\csc\b/g, 'csc');
    s = s.replace(/\\cot\b/g, 'cot');
    s = s.replace(/\\arcsin\b/g, 'arcsin');
    s = s.replace(/\\arccos\b/g, 'arccos');
    s = s.replace(/\\arctan\b/g, 'arctan');
    s = s.replace(/\\cdot\b/g, '*');
    s = s.replace(/\\times\b/g, '*');
    s = s.replace(/\\div\b/g, '/');

    // \\frac{a}{b} → (a)/(b)
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    // \\sqrt{a} → sqrt(a)
    s = s.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
    s = s.replace(/\\sqrt\s+(\S+)/g, 'sqrt($1)');

    // \\left( / \\right) → plain parens
    s = s.replace(/\\left\s*[\(\[\{|]/g, '(');
    s = s.replace(/\\right\s*[\)\]\}|]/g, ')');

    // Remove remaining backslashes
    s = s.replace(/\\/g, '');

    // Comma-as-decimal-separator: only replace when the string is exactly one integer part
    // followed by a comma and 1-3 digits (e.g. "0,39" -> "0.39").
    // Does NOT apply to thousands separators like "1,234" since those have exactly 3 digits
    // and the pattern below only fires for 1-2 digit fractional parts.
    s = s.replace(/^(-?\d+),(\d{1,2})$/, '$1.$2');

    // Collapse whitespace
    s = s.replace(/\s+/g, '');

    return s.toLowerCase();
};

/**
 * True when a and b are numeric and within `tolerance` of each other.
 * Useful for accepting 0.39 / .39 / 0.390 for an answer stored as "0.39".
 */
const numericClose = (a: string, b: string, tolerance = 0.005): boolean => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (isNaN(na) || isNaN(nb)) return false;
    return Math.abs(na - nb) <= tolerance;
};

/**
 * Checks a user-supplied answer against every accepted form for a problem.
 *
 * Acceptance order:
 *  1. Exact match after normalisation (possibleAnswers).
 *  2. Exact match after normalisation (acceptedKeySequences joined).
 *  3. Numeric tolerance match against possibleAnswers.
 *  4. Numeric tolerance match against acceptedKeySequences.
 */
const checkAnswer = (userInput: string, problem: Problem): boolean => {
    const norm = normalizeAnswer(userInput);

    // 1. possibleAnswers – exact normalised match
    if (problem.possibleAnswers.some((a) => normalizeAnswer(a) === norm)) return true;

    // 2. acceptedKeySequences – join keys then normalise
    if (problem.acceptedKeySequences && problem.acceptedKeySequences.length > 0) {
        if (problem.acceptedKeySequences.some((seq) => normalizeAnswer(seq.join('')) === norm)) return true;
    }

    // 3. possibleAnswers – numeric tolerance
    if (problem.possibleAnswers.some((a) => numericClose(norm, normalizeAnswer(a)))) return true;

    // 4. acceptedKeySequences – numeric tolerance
    if (problem.acceptedKeySequences && problem.acceptedKeySequences.length > 0) {
        if (problem.acceptedKeySequences.some((seq) => numericClose(norm, normalizeAnswer(seq.join(''))))) return true;
    }

    return false;
};

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

        if (checkAnswer(answer, problem)) {
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
                    placeholder={isFinished ? 'Problem closed' : 'e.g. x^2 + C or \\frac{1}{2}'}
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

            <div className='flex flex-col gap-2 w-full'>
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

            {showSolution && problem.funFact && (
                <div className='flex flex-col gap-2 w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700'>
                    <span className='text-[10px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1'>
                        Did you know?
                    </span>
                    <div className='border border-border/80 bg-secondary/10 rounded-xl p-5 shadow-sm'>
                        <p className='text-sm text-muted-foreground leading-relaxed italic'>{problem.funFact}</p>
                    </div>
                </div>
            )}

            {!problem.funFact && showSolution && <div className='mb-12' />}
        </div>
    );
};
