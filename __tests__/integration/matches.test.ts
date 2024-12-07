import { createClient } from '@/utils/supabase/client';
import { generateMatchesForAuthor, getRecentMatches } from '@/services/matches';

describe('Matches Flow', () => {
  it('should generate and retrieve matches', async () => {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No user logged in');

    // Generate matches
    await generateMatchesForAuthor(user.id);

    // Get matches
    const matches = await getRecentMatches();

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toHaveProperty('podcast');
    expect(matches[0].overallScore).toBeGreaterThan(0);
  });
});
