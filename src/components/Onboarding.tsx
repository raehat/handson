import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Skill } from '../lib/supabase';
import { MapPin, Clock, Heart, Sparkles } from 'lucide-react';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  const [formData, setFormData] = useState({
    location: profile?.location || '',
    bio: profile?.bio || '',
    interests: profile?.interests || [],
    availability: profile?.availability || [],
    selectedSkills: [] as string[],
  });

  const interestOptions = [
    'Environmental Conservation',
    'Education & Literacy',
    'Healthcare & Wellness',
    'Community Development',
    'Animal Welfare',
    'Arts & Culture',
    'Technology & Innovation',
    'Senior Care',
    'Youth Mentorship',
    'Food Security',
  ];

  const availabilityOptions = [
    'Weekday Mornings',
    'Weekday Afternoons',
    'Weekday Evenings',
    'Weekend Mornings',
    'Weekend Afternoons',
    'Weekend Evenings',
    'Flexible',
  ];

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .order('name');
    if (data) setAllSkills(data);
  }

  const toggleSelection = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  const handleSubmit = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await updateProfile({
        location: formData.location,
        bio: formData.bio,
        interests: formData.interests,
        availability: formData.availability,
      });

      if (profileError) throw profileError;

      if (formData.selectedSkills.length > 0 && profile) {
        const skillInserts = formData.selectedSkills.map((skillId) => ({
          profile_id: profile.id,
          skill_id: skillId,
          proficiency_level: 'intermediate',
        }));

        const { error: skillsError } = await supabase
          .from('volunteer_skills')
          .insert(skillInserts);

        if (skillsError) throw skillsError;
      }

      const { generateMatches } = await import('../lib/matching');
      const updatedProfile = {
        ...profile!,
        ...formData,
      };
      await generateMatches(updatedProfile);

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.location.trim() !== '';
    if (step === 2) return formData.interests.length > 0;
    if (step === 3) return formData.availability.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Help us match you with the perfect opportunities</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {step} of 3
              </span>
              <span className="text-sm font-medium text-emerald-600">
                {Math.round((step / 3) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Where are you located?</h2>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  City or Region
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about yourself (optional)
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={4}
                  placeholder="Share what motivates you to volunteer..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">What causes interest you?</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">Select all that apply</p>

              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        interests: toggleSelection(formData.interests, interest),
                      })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.interests.includes(interest)
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-sm">{interest}</span>
                  </button>
                ))}
              </div>

              {allSkills.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Skills</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select skills you can contribute (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            selectedSkills: toggleSelection(formData.selectedSkills, skill.id),
                          })
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.selectedSkills.includes(skill.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">When are you available?</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">Select all time slots that work for you</p>

              <div className="grid grid-cols-1 gap-3">
                {availabilityOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        availability: toggleSelection(formData.availability, time),
                      })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.availability.includes(time)
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
