'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { User } from '@/types/user';
import { LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';

interface NavigationProps {
  variant?: 'default' | 'jobseeker' | 'recruiter';
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Check for current user on mount and whenever localStorage changes
    const checkUser = () => {
      setCurrentUser(authStore.getCurrentUser());
    };
    
    checkUser();
    
    // Listen for storage events (when localStorage changes in same tab)
    window.addEventListener('storage', checkUser);
    
    // Also check periodically in case of same-tab updates
    const interval = setInterval(checkUser, 1000);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    authStore.logout();
    setCurrentUser(null);
    router.push('/');
  };

  return (
    <nav className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-[#043927]">
            CareerLaunch
          </Link>

          <div className="flex items-center gap-6">
            {/* Show different nav links based on variant */}
            {variant === 'jobseeker' && currentUser?.role === 'jobseeker' && (
              <>
                <Link href="/jobseeker/dashboard" className="text-gray-700 hover:text-[#043927] transition">
                  Dashboard
                </Link>
                <Link href="/jobseeker/jobs" className="text-gray-700 hover:text-[#043927] transition">
                  Find Jobs
                </Link>
              </>
            )}

            {variant === 'recruiter' && currentUser?.role === 'recruiter' && (
              <>
                <Link href="/recruiter/dashboard" className="text-gray-700 hover:text-[#043927] transition">
                  Dashboard
                </Link>
              </>
            )}

            {/* Auth buttons or Profile menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#043927] transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#043927] text-white flex items-center justify-center font-semibold">
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium">{currentUser.full_name}</span>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{currentUser.full_name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>

                    <Link
                      href={currentUser.role === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      href={currentUser.role === 'jobseeker' ? '/jobseeker/profile' : '/recruiter/profile'}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-[#043927] transition">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#043927] text-white px-6 py-2 rounded-lg hover:bg-[#065a3a] transition"
                >
                  {variant === 'recruiter' ? 'Post a Job' : 'Get Started'}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
