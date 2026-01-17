import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
    title: 'Daily Chalk',
    description: 'Daily math problems for your liking',
};

const RootLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <html lang='en' className={fontMono.variable}>
            <body className={`antialiased font-mono`}>{children}</body>
        </html>
    );
};

export default RootLayout;
