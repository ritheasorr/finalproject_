'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Zap, Target } from 'lucide-react';

export default function RecruiterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-[#043927]">CareerLaunch</Link>
            <div className="flex items-center gap-6">
              <Link href="/recruiter/dashboard" className="text-gray-700 hover:text-[#043927] transition">
                Dashboard
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-[#043927] transition">
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="bg-[#043927] text-white px-6 py-2 rounded-lg hover:bg-[#065a3a] transition"
              >
                Post a Job
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
              🚀 Join 1000+ hiring companies
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Find Top Talent for Your Team
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Connect with motivated students and early-career professionals ready to make an impact at your company.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/signup"
                className="bg-white text-[#043927] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                Post Your First Job
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
            <h2 className="text-4xl font-bold text-[#043927] mb-4">Why Recruiters Choose CareerLaunch</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your hiring process and find the perfect candidates
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#043927] to-[#065a3a] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Access to Top Talent</h3>
              <p className="text-gray-600">
                Connect with thousands of motivated students and early-career professionals actively seeking opportunities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#065a3a] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our smart matching system automatically ranks applicants based on job requirements to save you time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#043927] to-[#087d4e] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Easy Job Posting</h3>
              <p className="text-gray-600">
                Create and manage job postings in minutes with our intuitive dashboard. No complicated forms or processes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="bg-gradient-to-br from-[#065a3a] to-[#043927] w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#043927] mb-3">Track Applications</h3>
              <p className="text-gray-600">
                Monitor all applications in one place with real-time updates and application management tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#043927] mb-4">Ready to Find Your Next Hire?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Post your first job for free and start receiving applications from qualified candidates today.
          </p>
          <Link 
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#043927] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#065a3a] transition"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
