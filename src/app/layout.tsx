import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/language';
export const metadata: Metadata = { title: 'BuyLens — Evidence for your decision', description: 'A buyer-side agent that connects your criteria to review evidence and knows when to stop.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang={process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'zh' ? 'zh-CN' : 'en'}><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
