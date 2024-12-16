'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/Card';
import { ProfileSettings } from './ProfileSettings';
import { toast } from '@/components/ui/toast';
import { AuthorOnboardingData, PodcastPreferences } from '@/types/author';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  podcastPreferencesSchema,
  type PodcastPreferencesFormData
} from '@/types/settings';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types_db';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  prices: {
    id: string;
    product_id: string;
    products: {
      id: string;
      name: string;
    } | null;
  } | null;
};

interface PodcastPreferencesFormProps {
  preferences: Partial<PodcastPreferences>;
  onSubmit: (data: Partial<PodcastPreferences>) => Promise<void>;
  isSubmitting?: boolean;
}

export function PodcastPreferencesForm({
  preferences,
  onSubmit,
  isSubmitting
}: PodcastPreferencesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PodcastPreferencesFormData>({
    resolver: zodResolver(podcastPreferencesSchema),
    defaultValues: {
      example_shows: preferences.example_shows || [],
      interview_topics: preferences.interview_topics || [],
      target_audience: preferences.target_audience || [],
      preferred_formats: preferences.preferred_formats || [],
      content_boundaries: preferences.content_boundaries || [],
      min_listeners: preferences.min_listeners,
      max_duration: preferences.max_duration,
      availability: preferences.availability || {}
    }
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: 'Podcast preferences updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update podcast preferences',
        variant: 'destructive'
      });
    }
  });

  // Helper function to handle array field updates
  const handleArrayFieldChange = (
    field: keyof PodcastPreferencesFormData,
    value: string
  ) => {
    const currentValue = watch(field) as string[];
    setValue(field, value.split('\n').filter(Boolean));
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Example Shows */}
      <div className="space-y-2">
        <label htmlFor="example_shows" className="text-sm font-medium">
          Example Shows You Like
        </label>
        <textarea
          id="example_shows"
          value={(watch('example_shows') || []).join('\n')}
          onChange={(e) =>
            handleArrayFieldChange('example_shows', e.target.value)
          }
          placeholder="Enter one show per line"
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.example_shows && (
          <p className="text-sm text-red-500">{errors.example_shows.message}</p>
        )}
      </div>

      {/* Interview Topics */}
      <div className="space-y-2">
        <label htmlFor="interview_topics" className="text-sm font-medium">
          Interview Topics
        </label>
        <textarea
          id="interview_topics"
          value={(watch('interview_topics') || []).join('\n')}
          onChange={(e) =>
            handleArrayFieldChange('interview_topics', e.target.value)
          }
          placeholder="Enter one topic per line"
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.interview_topics && (
          <p className="text-sm text-red-500">
            {errors.interview_topics.message}
          </p>
        )}
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <label htmlFor="target_audience" className="text-sm font-medium">
          Target Audience
        </label>
        <textarea
          id="target_audience"
          value={(watch('target_audience') || []).join('\n')}
          onChange={(e) =>
            handleArrayFieldChange('target_audience', e.target.value)
          }
          placeholder="Enter one audience type per line"
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.target_audience && (
          <p className="text-sm text-red-500">
            {errors.target_audience.message}
          </p>
        )}
      </div>

      {/* Min Listeners */}
      <div className="space-y-2">
        <label htmlFor="min_listeners" className="text-sm font-medium">
          Minimum Listeners
        </label>
        <input
          type="number"
          id="min_listeners"
          {...register('min_listeners', { valueAsNumber: true })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.min_listeners && (
          <p className="text-sm text-red-500">{errors.min_listeners.message}</p>
        )}
      </div>

      {/* Max Duration */}
      <div className="space-y-2">
        <label htmlFor="max_duration" className="text-sm font-medium">
          Maximum Duration (minutes)
        </label>
        <input
          type="number"
          id="max_duration"
          {...register('max_duration', { valueAsNumber: true })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.max_duration && (
          <p className="text-sm text-red-500">{errors.max_duration.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

export function AuthorSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] =
    useState<Partial<AuthorOnboardingData> | null>(null);
  const [preferencesData, setPreferencesData] =
    useState<Partial<PodcastPreferences> | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const [profileResponse, subscriptionResponse] = await Promise.all([
          fetch('/api/profile/update'),
          supabase
            .from('subscriptions')
            .select('*, prices(*, products(*))')
            .single()
        ]);

        if (!profileResponse.ok) throw new Error('Failed to load profile data');

        const profileData = await profileResponse.json();
        setProfileData(profileData.data.profile);
        setPreferencesData(profileData.data.preferences);

        if (subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data);
          setIsPremium(
            subscriptionResponse.data.status === 'active' &&
              subscriptionResponse.data.prices?.products?.name === 'Pro'
          );
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleProfileUpdate = async (data: Partial<AuthorOnboardingData>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data })
      });

      if (!response.ok) throw new Error('Failed to update profile');

      // Update local state with new data
      setProfileData(data);

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferencesUpdate = async (data: Partial<PodcastPreferences>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: data })
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      // Update local state with new data
      setPreferencesData(data);

      // If user is premium, update matches immediately
      if (isPremium) {
        try {
          await fetch('/api/matches/regenerate', { method: 'POST' });
          toast({
            title: 'Success',
            description: 'Preferences updated and matches regenerated'
          });
        } catch (error) {
          console.error('Failed to regenerate matches:', error);
        }
      } else {
        toast({
          title: 'Success',
          description:
            "Preferences updated. Changes will be reflected in tomorrow's matches"
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update podcast preferences',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Podcast Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Profile Settings</h2>
            <ProfileSettings
              initialData={profileData}
              onSubmit={handleProfileUpdate}
              isSubmitting={isSubmitting}
            />
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Podcast Preferences</h2>
            {subscription?.status !== 'active' && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-zinc-300">
                  ⚡️ Upgrade to Pro to have your preference changes reflected
                  immediately in your matches. Free plan changes will be
                  reflected in tomorrow's matches.
                </p>
                <Link
                  href="/onboarding/pricing"
                  className="inline-flex items-center px-4 py-2 mt-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
            <PodcastPreferencesForm
              preferences={preferencesData || {}}
              onSubmit={handlePreferencesUpdate}
              isSubmitting={isSubmitting}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
