import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Opportunity, Category, Match } from '../lib/supabase';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityDetail } from './OpportunityDetail';
import { Header } from './Header';
import { Search, Filter, Sparkles, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMatches, setShowMatches] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [oppsResult, catsResult, matchesResult] = await Promise.all([
        supabase.from('opportunities').select('*').eq('active', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        profile ? supabase.from('matches').select('*').eq('profile_id', profile.id).eq('dismissed', false).order('match_score', { ascending: false }) : Promise.resolve({ data: [] })
      ]);

      if (oppsResult.data) setOpportunities(oppsResult.data);
      if (catsResult.data) setCategories(catsResult.data);
      if (matchesResult.data) setMatches(matchesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || opp.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const matchedOpportunityIds = new Set(matches.map(m => m.opportunity_id));
  const topMatches = showMatches
    ? filteredOpportunities.filter(opp => matchedOpportunityIds.has(opp.id)).slice(0, 3)
    : [];

  const otherOpportunities = filteredOpportunities.filter(
    opp => !matchedOpportunityIds.has(opp.id)
  );

  const getCategoryForOpportunity = (opp: Opportunity) => {
    return categories.find(c => c.id === opp.category_id);
  };

  const getMatchScore = (oppId: string) => {
    return matches.find(m => m.opportunity_id === oppId)?.match_score;
  };

  if (selectedOpportunity) {
    return (
      <OpportunityDetail
        opportunity={selectedOpportunity}
        category={getCategoryForOpportunity(selectedOpportunity)}
        onClose={() => setSelectedOpportunity(null)}
        onApplied={() => {
          setSelectedOpportunity(null);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600">
            Discover opportunities where you can make the greatest impact
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {matches.length > 0 && (
              <button
                onClick={() => setShowMatches(!showMatches)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  showMatches
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Matches
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {topMatches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Top Matches For You</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topMatches.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      category={getCategoryForOpportunity(opp)}
                      matchScore={getMatchScore(opp.id)}
                      onClick={() => setSelectedOpportunity(opp)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {topMatches.length > 0 ? 'More Opportunities' : 'All Opportunities'}
              </h2>
              {otherOpportunities.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherOpportunities.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      category={getCategoryForOpportunity(opp)}
                      onClick={() => setSelectedOpportunity(opp)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-600">No opportunities found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
