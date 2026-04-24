'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { User } from '@/types/user';
import { LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';

interface NavigationProps {
  variant?: 'default' | 'jobseeker' | 'recruiter';
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = () => {
      setCurrentUser(authStore.getCurrentUser());
    };
    
    checkUser();
    
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 1000);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authStore.logout();
    setCurrentUser(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#0f4d3a]/10 bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#043927] flex-shrink-0">
            CareerLaunch
          </Link>

          {/* Right: Nav links + Auth/Profile */}
          <div className="flex items-center gap-1">
            {variant === 'jobseeker' && currentUser?.role === 'jobseeker' && (
              <>
                <Link href="/jobseeker/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#043927] hover:bg-gray-50 transition">
                  Dashboard
                </Link>
                <Link href="/jobseeker/jobs" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#043927] hover:bg-gray-50 transition">
                  Find Jobs
                </Link>
              </>
            )}

            {variant === 'recruiter' && currentUser?.role === 'recruiter' && (
              <Link href="/recruiter/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#043927] hover:bg-gray-50 transition">
                Dashboard
              </Link>
            )}

            {/* Divider between nav links and profile */}
            {currentUser && (variant === 'jobseeker' || variant === 'recruiter') && (
              <div className="w-px h-6 bg-gray-200 mx-2" />
            )}

            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-[#0f4d3a]/15 hover:bg-[#f4f8f5] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                    {currentUser.full_name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-[#0f4d3a]/15 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={currentUser.role === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>

                      <Link
                        href={currentUser.role === 'jobseeker' ? '/jobseeker/profile' : '/recruiter/profile'}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Profile
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#043927] hover:bg-gray-50 transition">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-[#043927] to-[#065a3a] text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-95 transition"
                >
                  {variant === 'recruiter' ? 'Post a Job' : 'Get Started'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
