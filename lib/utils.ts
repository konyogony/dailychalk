import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { THEMES } from './themes';

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

export const getAllValidTopics = (): Set<string> => {
    const set = new Set<string>();
    Object.values(THEMES).forEach((arr) => {
        arr.forEach((t) => set.add(t));
    });
    return set;
};
