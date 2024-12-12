import { NextApiRequest, NextApiResponse } from 'next';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ProfileManager } from '@/services/profile-manager';

/**
 * API endpoint for updating author profile data
 * Handles both basic profile info and podcast preferences
 *
 * POST /api/profile/update
 *
 * Request body can include:
 * - profile: { name, bio, books }
 * - preferences: { example_shows, interview_topics, etc. }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { profile, preferences } = req.body;

    // Update profile if provided
    if (profile) {
      await ProfileManager.updateProfile(user.id, profile);
    }

    // Update preferences if provided
    if (preferences) {
      await ProfileManager.updatePodcastPreferences(user.id, preferences);
    }

    // Get updated profile data
    const updatedData = await ProfileManager.getProfile(user.id);

    return res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
