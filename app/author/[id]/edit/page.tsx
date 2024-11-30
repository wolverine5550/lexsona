import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditProfileForm from '@/components/author/EditProfileForm';
import { Author } from '@/types/author';

export const metadata: Metadata = {
  title: 'Edit Profile - Author Dashboard',
  description: 'Update your author profile information'
};

async function getAuthor(id: string): Promise<Author | null> {
  // TODO: Implement actual API call
  return null;
}

export default async function EditProfilePage({
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        <EditProfileForm author={author} />
      </div>
    </main>
  );
}
