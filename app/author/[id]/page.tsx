import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/author/ProfileHeader';
import ProfileBio from '@/components/author/ProfileBio';
import ProfileStats from '@/components/author/ProfileStats';
import PortfolioPreview from '@/components/author/PortfolioPreview';
import InterviewsPreview from '@/components/author/InterviewsPreview';
import { Author } from '@/types/author';

// Metadata for SEO
export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  // Fetch author data
  const author = await getAuthor(params.id);

  if (!author) {
    return {
      title: 'Author Not Found'
    };
  }

  return {
    title: `${author.name} - Author Profile`,
    description: author.bio.substring(0, 160),
    openGraph: {
      title: `${author.name} - Author Profile`,
      description: author.bio.substring(0, 160),
      images: [author.avatar]
    }
  };
}

async function getAuthor(id: string): Promise<Author | null> {
  // TODO: Implement actual API call
  return null;
}

export default async function AuthorProfile({
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
      <div className="max-w-4xl mx-auto space-y-8">
        <ProfileHeader author={author} />
        <ProfileBio author={author} />
        <ProfileStats author={author} />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Featured Works</h2>
          <PortfolioPreview works={author.works.slice(0, 3)} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Interviews</h2>
          <InterviewsPreview interviews={author.interviews.slice(0, 3)} />
        </section>
      </div>
    </main>
  );
}
