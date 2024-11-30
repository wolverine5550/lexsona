import Image from 'next/image';
import Link from 'next/link';
import { Twitter, Linkedin, Globe, Instagram } from 'lucide-react';
import { Author } from '@/types/author';

interface ProfileHeaderProps {
  author: Author;
}

const ProfileHeader = ({ author }: ProfileHeaderProps) => {
  // Social media icon mapping
  const socialIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    website: Globe,
    instagram: Instagram
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg" />

      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <Image
            src={author.avatar}
            alt={author.name}
            width={128}
            height={128}
            className="rounded-full border-4 border-white"
            priority
          />
        </div>

        {/* Author Info */}
        <div className="pt-20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{author.name}</h1>
              <p className="text-gray-600 mt-1">
                {author.location} · Joined{' '}
                {new Date(author.joinedDate).toLocaleDateString()}
              </p>
            </div>

            {/* Edit Profile Button - Only shown to profile owner */}
            <Link
              href={`/author/${author.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              aria-label="Edit profile"
            >
              Edit Profile
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mt-4">
            {Object.entries(author.socialLinks).map(([platform, url]) => {
              if (!url) return null;
              const Icon = socialIcons[platform as keyof typeof socialIcons];

              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label={`Visit ${platform} profile`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
