import Image from 'next/image';
import Link from 'next/link';
import { AuthorWork } from '@/types/author';
import { Book, Calendar, User } from 'lucide-react';

interface PortfolioGridProps {
  works: AuthorWork[];
}

const PortfolioGrid = ({ works }: PortfolioGridProps) => {
  // Helper function to format the publication date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {works.map((work) => (
        // Individual work card with hover effects
        <article
          key={work.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
        >
          {/* Book cover image container */}
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={work.coverImage}
              alt={`Cover of ${work.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          </div>

          {/* Work details section */}
          <div className="p-4 space-y-4">
            <h3 className="text-xl font-semibold line-clamp-2">{work.title}</h3>

            {/* Meta information with icons */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Published by {work.publisher}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(work.publishDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                <div className="flex flex-wrap gap-2">
                  {work.genre.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description with line clamp */}
            <p className="text-gray-700 text-sm line-clamp-3">
              {work.description}
            </p>

            {/* View details link */}
            <Link
              href={`/works/${work.id}`}
              className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium"
              aria-label={`View details for ${work.title}`}
            >
              View Details →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
};

export default PortfolioGrid;
