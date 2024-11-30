import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Author } from '@/types/author';
import PortfolioGrid from '@/components/author/PortfolioGrid';
import PortfolioFilters from '@/components/author/PortfolioFilters';

export const metadata: Metadata = {
  title: 'Author Portfolio',
  description: 'View all published works'
};

async function getAuthor(id: string): Promise<Author | null> {
  // TODO: Implement actual API call
  return null;
}

export default async function PortfolioPage({
  params
}: {
  params: { id: string };
}) {
  const author = await getAuthor(params.id);

  if (!author) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-gray-600 mt-2">
            All published works by {author.name}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64">
            <PortfolioFilters />
          </aside>

          <div className="flex-1">
            <PortfolioGrid works={author.works} />
          </div>
        </div>
      </div>
    </main>
  );
}
