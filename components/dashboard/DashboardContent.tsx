'use client';

import { User } from '@supabase/supabase-js';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { getRecentMatches, generateMatchesForAuthor } from '@/services/matches';
import { isPremiumUser, getMatchLimit } from '@/utils/subscription';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import type { PodcastMatch } from '@/types/matching';
import { populatePodcastDatabase } from '@/services/listen-notes';

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [matches, setMatches] = useState<PodcastMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<string>('');
  const [isPremium, setIsPremium] = useState(false);
  const [matchLimit, setMatchLimit] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!mounted) return;

      try {
        setIsLoading(true);
        setError(null);

        // Check premium status
        const premium = await isPremiumUser(createClient(), user.id);
        if (!mounted) return;
        setIsPremium(premium);

        // Get match limit based on subscription
        const limit = await getMatchLimit(createClient(), user.id, premium);
        if (!mounted) return;
        setMatchLimit(limit);

        // Load initial matches
        if (mounted) setLoadingState('Loading matches...');
        const { matches: initialMatches } = await getRecentMatches(user.id);
        if (!mounted) return;

        if (initialMatches.length === 0) {
          // If no matches exist, generate them
          if (mounted) setLoadingState('Generating initial matches...');
          await generateMatchesForAuthor(user.id);
          if (!mounted) return;

          // Fetch the newly generated matches
          const { matches: newMatches } = await getRecentMatches(user.id);
          if (!mounted) return;

          console.log('Generated new matches:', newMatches.length);
          setMatches(newMatches);
        } else {
          console.log('Found existing matches:', initialMatches.length);
          if (mounted) setMatches(initialMatches);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        if (mounted) {
          setError('Failed to load dashboard. Please try again later.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setLoadingState('');
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleGenerateMatches = async () => {
    let mounted = true;

    try {
      setIsLoading(true);
      setError(null);
      setLoadingState('Generating new matches...');

      await generateMatchesForAuthor(user.id);
      if (!mounted) return;

      const { matches: newMatches } = await getRecentMatches(user.id);
      if (!mounted) return;

      console.log('Generated matches:', newMatches.length);
      setMatches(newMatches);
    } catch (error) {
      console.error('Error generating matches:', error);
      if (mounted) {
        setError('Failed to generate new matches. Please try again later.');
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
        setLoadingState('');
      }
    }

    return () => {
      mounted = false;
    };
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Hi,{' '}
          {user?.user_metadata?.name ||
            user?.user_metadata?.full_name?.split(' ')[0] ||
            user?.email?.split('@')[0] ||
            'Guest'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">{loadingState || 'Loading matches...'}</p>
        </div>
      ) : matches.length === 0 && !error ? (
        <div className="text-center">
          <p className="text-gray-600">
            No matches found yet. Setting up your profile...
          </p>
          <Button onClick={handleGenerateMatches} className="mt-4">
            Generate Matches
          </Button>
        </div>
      ) : (
        <RecentMatches
          matches={matches}
          isPremium={isPremium}
          limit={matchLimit}
        />
      )}
    </div>
  );
}
