'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/api';
import { User } from '@/types/user';
import { LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';

interface NavigationProps {
  variant?: 'default' | 'jobseeker' | 'recruiter';
  links?: { label: string; href: string }[];
}

export default function Navigation({ variant = 'default', links = [] }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const normalizeImageUrl = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  };

  useEffect(() => {
    const checkUser = () => {
      const user = authStore.getCurrentUser();
      setCurrentUser(user);
      if (!user) {
        setProfileImageUrl('');
        return;
      }
      if (user.avatar_url) {
        setProfileImageUrl(normalizeImageUrl(user.avatar_url));
        return;
      }
      const fallbackAvatar =
        user.role === 'jobseeker'
          ? authStore.getJobSeekerProfile(user.id)?.avatar_url || ''
          : authStore.getRecruiterProfileMeta(user.id)?.avatar_url || '';
      setProfileImageUrl(normalizeImageUrl(fallbackAvatar));
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

  const navItemClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      pathname.startsWith(href)
        ? 'bg-white/20 text-white'
        : 'text-white/85 hover:text-white hover:bg-white/10'
    }`;

  const publicProfileHref = currentUser
    ? (currentUser.role === 'jobseeker'
      ? `/jobseekers/${currentUser.id}`
      : `/recruiters/${currentUser.id}`)
    : '/';

  return (
    <nav className="sticky top-0 z-40 border-b border-white/15 bg-gradient-to-r from-[#043927] via-[#0f5d43] to-[#1b7a57] backdrop-blur-md">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tight text-white flex-shrink-0">
            CareerLaunch
          </Link>

          {/* Right: Nav links + Auth/Profile */}
          <div className="flex items-center gap-1">
            {links.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 mr-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {variant === 'jobseeker' && currentUser?.role === 'jobseeker' && (
              <>
                <Link href="/jobseeker/dashboard" className={navItemClass('/jobseeker/dashboard')}>
                  Dashboard
                </Link>
                <Link href="/jobseeker/jobs" className={navItemClass('/jobseeker/jobs')}>
                  Find Jobs
                </Link>
              </>
            )}

            {variant === 'recruiter' && currentUser?.role === 'recruiter' && (
              <Link href="/recruiter/dashboard" className={navItemClass('/recruiter/dashboard')}>
                Dashboard
              </Link>
            )}

            {/* Divider between nav links and profile */}
            {currentUser && (variant === 'jobseeker' || variant === 'recruiter') && (
              <div className="w-px h-6 bg-white/25 mx-2" />
            )}

            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={publicProfileHref}
                    className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden border border-transparent hover:border-white/25 transition"
                    title="Open public profile"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={currentUser.full_name || 'Profile photo'}
                        className="w-full h-full object-cover"
                        onError={() => setProfileImageUrl('')}
                      />
                    ) : (
                      currentUser.full_name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </Link>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-white/20 hover:bg-white/10 transition"
                  >
                    <span className="text-sm font-medium text-white hidden sm:block max-w-[120px] truncate">
                      {currentUser.full_name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>

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
                <Link href="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-[#0f5d43] px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#f3fbf6] transition"
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
