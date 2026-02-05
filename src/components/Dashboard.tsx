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
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventOrg, setEventOrg] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [timeCommitment, setTimeCommitment] = useState('');
  const [schedule, setSchedule] = useState('');
  const [spotsAvailable, setSpotsAvailable] = useState(0);
  const [impactArea, setImpactArea] = useState('');
  const [requirements, setRequirements] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

async function handleCreateEvent(e: React.FormEvent) {
  e.preventDefault();

  if (!eventName || !eventLocation || !eventDate) {
    alert('Please fill required fields');
    return;
  }

  setCreatingEvent(true);

  try {
    const startDateTime = new Date(`${eventDate}T${eventTime || '00:00'}`);
    const endDateTime = endDate ? new Date(endDate) : null;

    const { error } = await supabase.from('opportunities').insert({
      title: eventName,
      description: eventDescription,
      organization: eventOrg || profile?.full_name || 'Community',
      category_id: categoryId,
      location: eventLocation,
      is_remote: isRemote,
      time_commitment: timeCommitment,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime?.toISOString() ?? null,
      recurring: false,
      schedule,
      spots_available: spotsAvailable,
      spots_filled: 0,
      image_url: "https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=800",
      impact_area: impactArea,
      requirements,
      active: true,
      created_by: profile?.id,
    });

    if (error) throw error;

    setShowCreateEvent(false);
    loadData();
  } catch (err) {
    console.error('Failed to create event:', err);
    alert('Error creating event');
  } finally {
    setCreatingEvent(false);
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

          {/* Create Event Button */}
          <button
            onClick={() => setShowCreateEvent(true)}
            className="px-5 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
          >
            Create Event
          </button>

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
        {showCreateEvent && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-lg relative">
      
      {/* Close Button */}
      <button
        onClick={() => setShowCreateEvent(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4">Create Event</h2>

      {/* Form */}
      <form onSubmit={handleCreateEvent} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">

  <input
    value={eventName}
    onChange={(e) => setEventName(e.target.value)}
    placeholder="Event Title *"
    className="w-full px-4 py-2 border rounded-lg"
    required
  />

  <textarea
    value={eventDescription}
    onChange={(e) => setEventDescription(e.target.value)}
    placeholder="Description"
    rows={3}
    className="w-full px-4 py-2 border rounded-lg"
  />

  <input
    value={eventOrg}
    onChange={(e) => setEventOrg(e.target.value)}
    placeholder="Organization"
    className="w-full px-4 py-2 border rounded-lg"
  />

  <input
    value={eventLocation}
    onChange={(e) => setEventLocation(e.target.value)}
    placeholder="Location *"
    className="w-full px-4 py-2 border rounded-lg"
    required
  />

  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={isRemote}
      onChange={(e) => setIsRemote(e.target.checked)}
    />
    Remote event
  </label>

  {/* Category */}
  <select
    value={categoryId ?? ''}
    onChange={(e) => setCategoryId(e.target.value)}
    className="w-full px-4 py-2 border rounded-lg"
  >
    <option value="">Select Category</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>

  {/* Dates */}
  <div className="grid grid-cols-2 gap-3">
    <input
      type="date"
      value={eventDate}
      onChange={(e) => setEventDate(e.target.value)}
      className="px-4 py-2 border rounded-lg"
      required
    />
    <input
      type="time"
      value={eventTime}
      onChange={(e) => setEventTime(e.target.value)}
      className="px-4 py-2 border rounded-lg"
    />
  </div>

  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="w-full px-4 py-2 border rounded-lg"
    placeholder="End date"
  />

  <input
    value={timeCommitment}
    onChange={(e) => setTimeCommitment(e.target.value)}
    placeholder="Time Commitment (e.g. 2 hours)"
    className="w-full px-4 py-2 border rounded-lg"
  />

  <input
    value={schedule}
    onChange={(e) => setSchedule(e.target.value)}
    placeholder="Schedule (e.g. Sat 5pm)"
    className="w-full px-4 py-2 border rounded-lg"
  />

  <input
    type="number"
    value={spotsAvailable}
    onChange={(e) => setSpotsAvailable(Number(e.target.value))}
    placeholder="Spots Available"
    className="w-full px-4 py-2 border rounded-lg"
  />

  <input
    value={impactArea}
    onChange={(e) => setImpactArea(e.target.value)}
    placeholder="Impact Area"
    className="w-full px-4 py-2 border rounded-lg"
  />

  <textarea
    value={requirements}
    onChange={(e) => setRequirements(e.target.value)}
    placeholder="Requirements"
    rows={3}
    className="w-full px-4 py-2 border rounded-lg"
  />

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Event Image
  </label>

  <div className="flex items-center gap-4">
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
      className="block w-full text-sm text-gray-600
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:bg-emerald-600 file:text-white
        hover:file:bg-emerald-700"
    />

    {selectedImage && (
      <span className="text-sm text-gray-500 truncate max-w-[160px]">
        {selectedImage.name}
      </span>
    )}
  </div>
</div>


  {/* Actions */}
  <div className="flex justify-end gap-3 pt-2">
    <button
      type="button"
      onClick={() => setShowCreateEvent(false)}
      className="px-4 py-2 border rounded-lg"
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={creatingEvent}
      className="px-5 py-2 bg-emerald-600 text-white rounded-lg"
    >
      {creatingEvent ? 'Creating...' : 'Create Event'}
    </button>
  </div>

</form>


    </div>
  </div>
)}
      </main>
    </div>
  );
}
