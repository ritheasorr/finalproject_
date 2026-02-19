'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Briefcase, Clock, Shield, TrendingUp } from 'lucide-react';

export default function JobSeekerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-[#043927]">CareerLaunch</Link>
            <div className="flex items-center gap-6">
              <Link href="/jobseeker/dashboard" className="text-gray-700 hover:text-[#043927] transition">
                Dashboard
              </Link>
              <Link href="/jobseeker/jobs" className="text-gray-700 hover:text-[#043927] transition">
                Find Jobs
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-[#043927] transition">
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="bg-[#043927] text-white px-6 py-2 rounded-lg hover:bg-[#065a3a] transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#043927] to-[#065a3a] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
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
              <Link 
                href="/jobseeker/jobs"
                className="bg-white text-[#043927] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                Find Jobs
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#043927] mb-4">Why Job Seekers Love CareerLaunch</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're built differently because we're built for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#043927] to-[#065a3a] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Entry-Level Focused Opportunities</h3>
              <p className="text-gray-600">
                Every job and internship is curated specifically for students and recent graduates.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#065a3a] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Quick & Easy Applications</h3>
              <p className="text-gray-600">
                Apply to multiple positions with one click. Upload your CV once and use it for all applications.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#043927] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Verified Employers Only</h3>
              <p className="text-gray-600">
                All companies are vetted to ensure legitimate opportunities. Your safety and trust are our top priority.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
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
