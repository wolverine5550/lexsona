import { Author } from '@/types/author';

interface ProfileBioProps {
  author: Author;
}

const ProfileBio = ({ author }: ProfileBioProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">About</h2>
      <p className="text-gray-700 whitespace-pre-wrap">{author.bio}</p>
    </div>
  );
};

export default ProfileBio;
