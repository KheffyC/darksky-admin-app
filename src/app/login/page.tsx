'use client';
import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, redirect } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { AuthError } from 'next-auth';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      // Check for error first, even if ok is true
      if (result?.error) {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid email or password. Please try again.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Login Successful',
          message: 'Redirecting to dashboard...',
        });
        await update();
        router.replace('/dashboard');
        window.location.assign('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      addToast({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.',
      });
      if (error instanceof AuthError) {
        return redirect(`/dashboard`);
      }

      throw error; // Let the error handling in the app handle redirects
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/DSP_LOGO.png" alt="Dark Sky Percussion" width={56} height={56} className="rounded" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Finance Admin</span>
        </div>
        <div className="bg-white p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-ink mb-2">Welcome back</h1>
            <p className="text-muted">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-line rounded-lg px-4 py-3 text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors duration-200"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-line rounded-lg px-4 py-3 text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors duration-200"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ink text-white py-3 rounded-lg hover:bg-ink-hover transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              Contact your administrator if you need account access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
