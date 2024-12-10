'use client';

import { User } from '@supabase/supabase-js';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { getRecentMatches, generateMatchesForAuthor } from '@/services/matches';
import { isPremiumUser, getMatchLimit } from '@/utils/subscription';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import type { PodcastMatch } from '@/types/matching';

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [matches, setMatches] = useState<PodcastMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [matchLimit, setMatchLimit] = useState(3);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Check subscription status
        const premium = await isPremiumUser(supabase, user.id);
        setIsPremium(premium);
        const limit = await getMatchLimit(supabase, user.id, premium);
        setMatchLimit(limit);

        // Load matches
        const { matches: currentMatches } = await getRecentMatches(user.id);
        if (!currentMatches.length) {
          await generateMatchesForAuthor(user.id);
          const { matches: newMatches } = await getRecentMatches(user.id);
          setMatches(newMatches);
        } else {
          setMatches(currentMatches);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleGenerateMatches = async () => {
    try {
      setIsLoading(true);
      await generateMatchesForAuthor(user.id);
      const { matches: newMatches } = await getRecentMatches(user.id);
      setMatches(newMatches);
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Welcome back, {user?.email?.split('@')[0] || 'Guest'}
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center">Loading matches...</div>
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
