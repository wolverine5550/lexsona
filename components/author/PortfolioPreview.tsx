import Image from 'next/image';
import { AuthorWork } from '@/types/author';

interface PortfolioPreviewProps {
  works: AuthorWork[];
}

const PortfolioPreview = ({ works }: PortfolioPreviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {works.map((work) => (
        <div
          key={work.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="relative h-48">
            <Image
              src={work.coverImage}
              alt={work.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{work.title}</h3>
            <p className="text-gray-600 text-sm mb-2">
              Published by {work.publisher} ·{' '}
              {new Date(work.publishDate).getFullYear()}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {work.genre.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
            <p className="text-gray-700 text-sm line-clamp-2">
              {work.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioPreview;
