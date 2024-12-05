import { PodcastPreferencesForm } from '@/components/forms/PodcastPreferencesForm';

export default function PodcastPreferencesPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Podcast Preferences</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Help us match you with the perfect podcasts by sharing your
          preferences and goals for podcast appearances.
        </p>
      </div>

      {/* Podcast Preferences Form */}
      <PodcastPreferencesForm />
    </div>
  );
}
