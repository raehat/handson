import { MapPin, Clock, Users, Calendar, Sparkles } from 'lucide-react';
import { Opportunity, Category } from '../lib/supabase';

interface OpportunityCardProps {
  opportunity: Opportunity;
  category?: Category;
  matchScore?: number;
  onClick: () => void;
}

export function OpportunityCard({ opportunity, category, matchScore, onClick }: OpportunityCardProps) {
  const spotsLeft = opportunity.spots_available - opportunity.spots_filled;
  const isFilling = spotsLeft <= 3 && spotsLeft > 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-100 hover:border-emerald-200 group"
    >
      {matchScore !== undefined && matchScore >= 70 && (
        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-3">
          <Sparkles className="w-4 h-4" />
          <span>{matchScore}% Match</span>
        </div>
      )}

      <div className="flex gap-4">
        {opportunity.image_url && (
          <img
            src={opportunity.image_url}
            alt={opportunity.title}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
              {opportunity.title}
            </h3>
            {category && (
              <span
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-700`}
              >
                {category.name}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {opportunity.organization}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{opportunity.is_remote ? 'Remote' : opportunity.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{opportunity.time_commitment}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(opportunity.start_date).toLocaleDateString()}</span>
            </div>
          </div>

          {spotsLeft > 0 && (
            <div className="mt-3 flex items-center gap-1 text-xs">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className={isFilling ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
