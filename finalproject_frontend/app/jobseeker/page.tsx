'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Briefcase, Clock, Shield, TrendingUp } from 'lucide-react';
import { authStore } from '@/store/authStore';
import Navigation from '@/components/Navigation';

export default function JobSeekerPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = authStore.getCurrentUser();
    setIsLoggedIn(!!user);
  }, []);

  return (
    <div className="min-h-screen page-gradient">
      {/* Navigation */}
      <Navigation variant="jobseeker" />

      {/* Hero Section */}
      <section className="text-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-shell text-center max-w-5xl mx-auto px-6 py-14 sm:px-12 stagger-in">
            <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6">
              ✨ 500+ new opportunities added this week
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Launch Your Career with Confidence
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Connect with top companies offering jobs and internships designed for students and early-career professionals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/jobseeker/jobs"
                className="bg-white text-[#043927] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                Find Jobs
                <ArrowRight className="w-5 h-5" />
              </Link>
              {!isLoggedIn && (
                <Link 
                  href="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#043927] mb-4">Why Job Seekers Love CareerLaunch</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're built differently because we're built for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="surface-card surface-card-hover p-8">
              <div className="bg-gradient-to-br from-[#043927] to-[#065a3a] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Entry-Level Focused Opportunities</h3>
              <p className="text-gray-600">
                Every job and internship is curated specifically for students and recent graduates.
              </p>
            </div>

            <div className="surface-card surface-card-hover p-8">
              <div className="bg-gradient-to-br from-[#065a3a] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Quick & Easy Applications</h3>
              <p className="text-gray-600">
                Apply to multiple positions with one click. Upload your CV once and use it for all applications.
              </p>
            </div>

            <div className="surface-card surface-card-hover p-8">
              <div className="bg-gradient-to-br from-[#043927] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Verified Employers Only</h3>
              <p className="text-gray-600">
                All companies are vetted to ensure legitimate opportunities. Your safety and trust are our top priority.
              </p>
            </div>

            <div className="surface-card surface-card-hover p-8">
              <div className="bg-gradient-to-br from-[#065a3a] to-[#043927] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Career Growth Resources</h3>
              <p className="text-gray-600">
                Access free resume tips, interview guides, and career advice to help you stand out.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
