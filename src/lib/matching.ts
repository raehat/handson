import { supabase, Profile, Opportunity } from './supabase';

interface MatchResult {
  opportunityId: string;
  score: number;
  reasons: string[];
}

export async function generateMatches(profile: Profile): Promise<void> {
  try {
    const [opportunitiesResult, volunteerSkillsResult, categoriesResult] = await Promise.all([
      supabase.from('opportunities').select('*').eq('active', true),
      supabase.from('volunteer_skills').select('skill_id').eq('profile_id', profile.id),
      supabase.from('categories').select('*'),
    ]);

    if (!opportunitiesResult.data) return;

    const opportunities = opportunitiesResult.data;
    const volunteerSkillIds = new Set(
      volunteerSkillsResult.data?.map((vs) => vs.skill_id) || []
    );
    const categories = categoriesResult.data || [];

    const matches: MatchResult[] = [];

    for (const opp of opportunities) {
      const score = await calculateMatchScore(opp, profile, volunteerSkillIds, categories);
      if (score.score >= 50) {
        matches.push({
          opportunityId: opp.id,
          score: score.score,
          reasons: score.reasons,
        });
      }
    }

    if (matches.length > 0) {
      const matchInserts = matches.map((match) => ({
        profile_id: profile.id,
        opportunity_id: match.opportunityId,
        match_score: match.score,
        match_reasons: match.reasons,
      }));

      await supabase.from('matches').upsert(matchInserts, {
        onConflict: 'profile_id,opportunity_id',
      });
    }
  } catch (error) {
    console.error('Error generating matches:', error);
  }
}

async function calculateMatchScore(
  opportunity: Opportunity,
  profile: Profile,
  volunteerSkillIds: Set<string>,
  categories: any[]
): Promise<{ score: number; reasons: string[] }> {
  let score = 0;
  const reasons: string[] = [];

  const oppSkillsResult = await supabase
    .from('opportunity_skills')
    .select('skill_id, required')
    .eq('opportunity_id', opportunity.id);

  const oppSkills = oppSkillsResult.data || [];
  const oppSkillIds = new Set(oppSkills.map((s) => s.skill_id));

  const matchingSkills = Array.from(volunteerSkillIds).filter((skillId) =>
    oppSkillIds.has(skillId)
  );

  if (matchingSkills.length > 0) {
    const skillScore = Math.min(40, matchingSkills.length * 15);
    score += skillScore;
    reasons.push(`${matchingSkills.length} matching skill${matchingSkills.length > 1 ? 's' : ''}`);
  }

  const category = categories.find((c) => c.id === opportunity.category_id);
  if (category && profile.interests.some((interest) =>
    interest.toLowerCase().includes(category.name.toLowerCase()) ||
    category.name.toLowerCase().includes(interest.toLowerCase())
  )) {
    score += 30;
    reasons.push('Matches your interests');
  }

  const oppLocation = opportunity.location.toLowerCase();
  const profileLocation = profile.location.toLowerCase();
  if (opportunity.is_remote) {
    score += 15;
    reasons.push('Remote opportunity');
  } else if (profileLocation && oppLocation.includes(profileLocation.split(',')[0])) {
    score += 20;
    reasons.push('In your area');
  }

  const hasAvailability = profile.availability && profile.availability.length > 0;
  if (hasAvailability) {
    score += 10;
    reasons.push('Fits your availability');
  }

  const startDate = new Date(opportunity.start_date);
  const now = new Date();
  const daysUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilStart >= 7 && daysUntilStart <= 30) {
    score += 5;
  }

  return { score, reasons };
}
