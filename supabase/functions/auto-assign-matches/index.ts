import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Profile {
  id: string;
  email: string;
  full_name: string;
  location: string;
  interests: string[];
  availability: string[];
  last_auto_assign_run: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization: string;
  category_id: string;
  location: string;
  is_remote: boolean;
  time_commitment: string;
  start_date: string;
  spots_available: number;
  spots_filled: number;
  active: boolean;
}

interface MatchResult {
  opportunityId: string;
  score: number;
  reasons: string[];
}

async function calculateMatchScore(
  opportunity: Opportunity,
  profile: Profile,
  volunteerSkillIds: Set<string>,
  categories: any[],
  oppSkills: any[]
): Promise<{ score: number; reasons: string[] }> {
  let score = 0;
  const reasons: string[] = [];

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

async function generateMatchesForProfile(
  supabase: any,
  profile: Profile,
  opportunities: Opportunity[],
  categories: any[]
): Promise<MatchResult[]> {
  const { data: volunteerSkills } = await supabase
    .from('volunteer_skills')
    .select('skill_id')
    .eq('profile_id', profile.id);

  const volunteerSkillIds = new Set(
    volunteerSkills?.map((vs: any) => vs.skill_id) || []
  );

  const matches: MatchResult[] = [];

  for (const opp of opportunities) {
    if (opp.spots_filled >= opp.spots_available) {
      continue;
    }

    const { data: oppSkills } = await supabase
      .from('opportunity_skills')
      .select('skill_id, required')
      .eq('opportunity_id', opp.id);

    const score = await calculateMatchScore(
      opp,
      profile,
      volunteerSkillIds,
      categories,
      oppSkills || []
    );

    if (score.score >= 70) {
      matches.push({
        opportunityId: opp.id,
        score: score.score,
        reasons: score.reasons,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auto_assign_enabled', true);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No profiles with auto-assign enabled', processed: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: opportunities, error: oppsError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('active', true);

    if (oppsError) throw oppsError;

    const { data: categories, error: catsError } = await supabase
      .from('categories')
      .select('*');

    if (catsError) throw catsError;

    let totalApplicationsCreated = 0;
    let totalMatchesUpdated = 0;

    for (const profile of profiles) {
      try {
        const matches = await generateMatchesForProfile(
          supabase,
          profile,
          opportunities || [],
          categories || []
        );

        if (matches.length > 0) {
          const matchInserts = matches.map((match) => ({
            profile_id: profile.id,
            opportunity_id: match.opportunityId,
            match_score: match.score,
            match_reasons: match.reasons,
          }));

          const { error: matchError } = await supabase
            .from('matches')
            .upsert(matchInserts, {
              onConflict: 'profile_id,opportunity_id',
            });

          if (matchError) {
            console.error(`Error updating matches for profile ${profile.id}:`, matchError);
          } else {
            totalMatchesUpdated += matches.length;
          }

          const topMatch = matches[0];

          const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('opportunity_id', topMatch.opportunityId)
            .maybeSingle();

          if (!existingApp) {
            const { error: appError } = await supabase
              .from('applications')
              .insert({
                profile_id: profile.id,
                opportunity_id: topMatch.opportunityId,
                status: 'pending',
                message: `Auto-matched based on: ${topMatch.reasons.join(', ')}`,
                auto_assigned: true,
              });

            if (appError) {
              console.error(`Error creating application for profile ${profile.id}:`, appError);
            } else {
              totalApplicationsCreated++;
            }
          }
        }

        await supabase
          .from('profiles')
          .update({ last_auto_assign_run: new Date().toISOString() })
          .eq('id', profile.id);

      } catch (error) {
        console.error(`Error processing profile ${profile.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        profilesProcessed: profiles.length,
        matchesUpdated: totalMatchesUpdated,
        applicationsCreated: totalApplicationsCreated,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in auto-assign function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
