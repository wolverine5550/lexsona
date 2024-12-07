'use client';

import { User } from '@supabase/supabase-js';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { getRecentMatches, generateMatchesForAuthor } from '@/services/matches';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import type { PodcastMatch } from '@/types/matching';

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [matches, setMatches] = useState<PodcastMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        let currentMatches = await getRecentMatches();
        if (!currentMatches.length && user) {
          await generateMatchesForAuthor(user.id);
          currentMatches = await getRecentMatches();
        }
        setMatches(currentMatches);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [user]);

  const handleGenerateMatches = async () => {
    try {
      setIsLoading(true);
      await generateMatchesForAuthor(user.id);
      const newMatches = await getRecentMatches();
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
        <p className="text-xl text-muted-foreground mt-2">
          Here are your latest podcast matches
        </p>
      </div>

      <Button onClick={handleGenerateMatches} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Generate New Matches'}
      </Button>

      {isLoading ? (
        <div className="text-center">Loading matches...</div>
      ) : (
        <RecentMatches matches={matches} />
      )}
    </div>
  );
}
