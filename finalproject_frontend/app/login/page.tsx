'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'jobseeker' | 'recruiter'>('jobseeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = authStore.login(email, password);
    
    if (!user) {
      setError('Invalid email or password');
      return;
    }

    if (user.role !== userType) {
      setError(`This account is registered as a ${user.role}. Please select the correct account type.`);
      return;
    }

    // Redirect based on role
    if (user.role === 'jobseeker') {
      router.push('/jobseeker');
    } else {
      router.push('/recruiter');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundImage: "linear-gradient(149.491deg, rgb(249, 250, 251) 0%, rgb(255, 255, 255) 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#043927] pt-8 px-8 pb-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome Back</h1>
            <p className="text-[#dcfce7] text-center">Sign in to continue</p>
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
                  placeholder="Enter your password"
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#043927] rounded focus:ring-2 focus:ring-[#043927]"
                />
                <span className="text-[#364153]">Remember me</span>
              </label>
              <button type="button" className="text-[#043927] hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#043927] text-white py-3 rounded-lg hover:bg-[#065a3a] transition font-medium"
            >
              Sign In
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-[#4a5565]">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-[#043927] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-[#4a5565] mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
