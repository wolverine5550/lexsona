import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Author } from '@/types/author';
import { Upload, X } from 'lucide-react';

interface EditProfileFormProps {
  author: Author;
}

const EditProfileForm = ({ author }: EditProfileFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(author.avatar);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    // Validate required fields
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Name is required' }));
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Only navigate after API call completes
      router.push(`/author/${author.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      data-testid="edit-profile-form"
      aria-label="Edit profile form"
    >
      {/* Avatar Upload */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Profile Photo
        </label>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Image
              src={avatarPreview}
              alt="Profile preview"
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => setAvatarPreview(author.avatar)}
              className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
              aria-label="Reset avatar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
            <Upload className="w-5 h-5" />
            <span>Upload New Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              data-testid="avatar-input"
            />
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={author.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Author name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={author.bio}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Author biography"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            defaultValue={author.location}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Author location"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Links</h3>
        {Object.entries(author.socialLinks).map(([platform, url]) => (
          <div key={platform}>
            <label
              htmlFor={platform}
              className="block text-sm font-medium text-gray-700 capitalize"
            >
              {platform}
            </label>
            <input
              type="url"
              id={platform}
              name={`socialLinks.${platform}`}
              defaultValue={url}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              aria-label={`${platform} profile URL`}
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
