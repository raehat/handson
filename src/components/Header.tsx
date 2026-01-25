import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, User, LogOut, Calendar, History } from 'lucide-react';

export function Header() {
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HandsOn</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Discover
            </a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Calendar
            </a>
            <a href="#" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              Activity
            </a>
          </nav>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {profile?.full_name}
              </span>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </a>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
