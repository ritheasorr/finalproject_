'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authStore } from '@/store/authStore';

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'jobseeker' | 'recruiter'>('jobseeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const user = authStore.signup(email, password, fullName, userType);
      
      // Redirect based on role
      if (user.role === 'jobseeker') {
        router.push('/jobseeker');
      } else {
        router.push('/recruiter');
      }
    } catch (err) {
      setError('An account with this email already exists');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundImage: "linear-gradient(146.964deg, rgb(249, 250, 251) 0%, rgb(255, 255, 255) 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#043927] pt-8 px-8 pb-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Create Account</h1>
            <p className="text-[#dcfce7] text-center">Join our platform today</p>
          </div>

          {/* User Type Toggle */}
          <div className="bg-[#f3f4f6] m-6 p-1 rounded-lg flex gap-1">
            <button
              type="button"
              onClick={() => setUserType('jobseeker')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition ${
                userType === 'jobseeker'
                  ? 'bg-[#043927] text-white shadow-md'
                  : 'bg-transparent text-[#4a5565]'
              }`}
            >
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setUserType('recruiter')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition ${
                userType === 'recruiter'
                  ? 'bg-[#043927] text-white shadow-md'
                  : 'bg-transparent text-[#4a5565]'
              }`}
            >
              Recruiter
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm text-[#364153] mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-3 border border-[#d1d5dc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-[#364153] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-3 border border-[#d1d5dc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-[#364153] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-3 border border-[#d1d5dc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-[#364153] mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3 py-3 border border-[#d1d5dc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043927]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-[#043927] rounded focus:ring-2 focus:ring-[#043927]"
              />
              <span className="text-sm text-[#364153]">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#043927] text-white py-3 rounded-lg hover:bg-[#065a3a] transition font-medium"
            >
              Create Account
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-[#4a5565]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#043927] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
