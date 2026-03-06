'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authStore } from '@/store/authStore';
import Navigation from '@/components/Navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'jobseeker' | 'recruiter' | null>(null);

  useEffect(() => {
    const user = authStore.getCurrentUser();
    setIsLoggedIn(!!user);
    setUserRole(user?.role || null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#043927] to-[#065a3a] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6">
              ✨ 500+ new opportunities added this week
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Launch Your Career with Confidence
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Connect with top companies offering jobs and internships designed for students and early-career professionals.
            </p>
            <div className="flex justify-center gap-4">
              {isLoggedIn ? (
                <Link 
                  href={userRole === 'jobseeker' ? '/jobseeker/dashboard' : '/recruiter/dashboard'}
                  className="bg-white text-[#043927] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/signup"
                    className="bg-white text-[#043927] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    Find Jobs
                  </Link>
                  <Link 
                    href="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#043927] mb-4">Why CareerLaunch?</h2>
            <p className="text-xl text-gray-600">Built for students and early-career professionals</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[#043927]/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Entry-Level Focus</h3>
              <p className="text-gray-600">Jobs and internships designed for those starting their career journey</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[#043927]/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Quick Apply</h3>
              <p className="text-gray-600">Streamlined application process to save you time</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[#043927]/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Smart Matching</h3>
              <p className="text-gray-600">AI-powered matching to find the best opportunities for you</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
