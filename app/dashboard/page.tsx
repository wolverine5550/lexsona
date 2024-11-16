import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types_db';

/**
 * Dashboard Page Component
 * Shows author's profile information and book details
 * Provides quick access to edit functionality
 */
export default async function DashboardPage() {
  // Create server-side Supabase client
  const supabase = createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // If no user, redirect to sign in
  if (!user) {
    redirect('/signin');
  }

  // Get author profile with all fields
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get all books by this author
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Author Profile Section */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Author Avatar */}
              {profile?.avatar_url && (
                <div className="relative h-24 w-24 overflow-hidden rounded-full">
                  <Image
                    src={profile.avatar_url}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Author Info */}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="mt-1 text-zinc-400">{profile?.bio}</p>
                {profile?.expertise && profile.expertise.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Expertise
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {profile.expertise.map((item: string) => (
                        <span
                          key={item}
                          className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Profile Link */}
            <Link
              href="/onboarding/profile"
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Books Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Your Books</h2>
            <Link
              href="/onboarding/book"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Add New Book
            </Link>
          </div>

          {/* Books Grid */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books?.map((book) => (
              <div
                key={book.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-6"
              >
                <h3 className="text-lg font-medium text-white">{book.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
                  {book.description}
                </p>

                {/* Book Metadata */}
                {book.genre && book.genre.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-zinc-300">Genre</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {book.genre.map((g: string) => (
                        <span
                          key={g}
                          className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Book Link */}
                <div className="mt-4">
                  <Link
                    href={`/onboarding/book?edit=${book.id}`}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Edit Book →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
