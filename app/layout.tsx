import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { Providers } from '@/components/providers/Providers';

const title = 'Your App Title';
const description = 'Brought to you by Vercel, Stripe, and Supabase.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title,
  description,
  openGraph: {
    title: 'Your App Title',
    description: 'Brought to you by Vercel, Stripe, and Supabase.'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-50 antialiased">
        <Providers>
          <Navbar />
          <main
            id="skip"
            className="min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)]"
          >
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
