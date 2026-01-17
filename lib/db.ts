import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DailyProblems } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'problems.json');

export const getDailyProblems = async () => {
    try {
        const content = await readFile(DATA_FILE, 'utf-8');
        return JSON.parse(content) as { lastUpdate: string; problemSet: DailyProblems };
    } catch {
        return null;
    }
};

export const saveDailyProblems = async (problemSet: DailyProblems) => {
    await mkdir(DATA_DIR, { recursive: true });
    const data = {
        lastUpdate: new Date().toISOString().split('T')[0],
        problemSet: JSON.parse(JSON.stringify(problemSet)),
    };
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};
