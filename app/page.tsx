import { Suspense } from 'react';
import { SelectionWrapper } from '@/components/selection-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export default function Page() {
    return (
        <main className='min-h-screen bg-background'>
            <Suspense fallback={<Skeleton />}>
                <SelectionWrapper />
            </Suspense>
        </main>
    );
}
