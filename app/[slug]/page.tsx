import { Client } from '@/components/client';
import { getDailyProblems } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const data = await getDailyProblems();
    if (!data) notFound();

    const allProblems = Object.values(data.problemSet).flatMap((diffs) => Object.values(diffs));
    const problem = allProblems.find((p) => p.id === slug);

    if (!problem) notFound();

    return (
        <main className='min-h-screen w-full flex flex-col items-center bg-background px-4 py-8 sm:py-12'>
            <div className='flex flex-col gap-6 w-full max-w-lg'>
                <Link href='/' className='self-start text-xs text-muted-foreground hover:text-foreground'>
                    ← back to selection
                </Link>
                <Client problem={problem} />
            </div>
        </main>
    );
};

export default Page;
