import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Opportunity, Category } from '../lib/supabase';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Users,
  Briefcase,
  Heart,
  CheckCircle,
  Download,
  Share2,
} from 'lucide-react';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  category?: Category;
  onClose: () => void;
  onApplied: () => void;
}

export function OpportunityDetail({ opportunity, category, onClose, onApplied }: OpportunityDetailProps) {
  const { profile } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleApply = async () => {
    if (!profile) return;

    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert([
        {
          opportunity_id: opportunity.id,
          profile_id: profile.id,
          message: message,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setApplied(true);
      setShowSuccess(true);
      setTimeout(() => {
        onApplied();
      }, 2000);
    } catch (error) {
      console.error('Error applying:', error);
      alert('Failed to apply. You may have already applied to this opportunity.');
    } finally {
      setApplying(false);
    }
  };

  const addToCalendar = () => {
    const startDate = new Date(opportunity.start_date);
    const endDate = opportunity.end_date ? new Date(opportunity.end_date) : startDate;

    const event = {
      title: opportunity.title,
      description: `${opportunity.description}\n\nOrganization: ${opportunity.organization}\nLocation: ${opportunity.location}`,
      start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      location: opportunity.location,
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${opportunity.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: opportunity.title,
          text: `Check out this volunteer opportunity: ${opportunity.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const spotsLeft = opportunity.spots_available - opportunity.spots_filled;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={share}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={addToCalendar}
                className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {opportunity.image_url && (
          <img
            src={opportunity.image_url}
            alt={opportunity.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              {category && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 mb-3">
                  {category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{opportunity.title}</h1>
              <p className="text-lg text-gray-600">{opportunity.organization}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-200 my-6">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium">{opportunity.is_remote ? 'Remote' : opportunity.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Time Commitment</p>
                <p className="font-medium">{opportunity.time_commitment}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(opportunity.start_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Spots Left</p>
                <p className="font-medium">{spotsLeft} / {opportunity.spots_available}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Opportunity</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{opportunity.description}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Impact Area</h2>
              </div>
              <p className="text-gray-700">{opportunity.impact_area}</p>
            </div>

            {opportunity.schedule && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
                </div>
                <p className="text-gray-700">{opportunity.schedule}</p>
              </div>
            )}

            {opportunity.requirements && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
                <p className="text-gray-700">{opportunity.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {!applied ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for This Opportunity</h2>
            <p className="text-gray-600 mb-6">
              Tell the organizers why you're interested and what you can contribute.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your motivation and relevant experience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-4"
              rows={4}
            />

            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600">
              The organization will review your application and get back to you soon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
