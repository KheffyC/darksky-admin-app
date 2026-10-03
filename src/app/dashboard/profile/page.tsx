'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    fetchUserProfile();
  }, [session, status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const profile = await response.json();
      setUserProfile(profile);
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const inputClassName =
    'w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted transition-all duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation (only if user is trying to change password)
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        return false;
      }

      if (!formData.newPassword) {
        setError('New password is required');
        return false;
      }

      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim()
      };

      // Only include password fields if user is changing password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Handle password change - sign out user for security
      if (result.passwordChanged) {
        setSuccess('Password updated successfully! You will be signed out for security reasons.');
        
        // Wait a moment for user to see the message
        setTimeout(async () => {
          await signOut({ 
            callbackUrl: '/login',
            redirect: true 
          });
        }, 2000);
        
        return; // Exit early, don't continue with normal flow
      }

      // Update session if email changed (non-password updates only)
      if (formData.email !== userProfile?.email) {
        await update({
          ...session,
          user: {
            ...session?.user,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`
          }
        });
      }

      setSuccess('Profile updated successfully!');
      setUserProfile(result);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">Unable to load profile data</p>
      </div>
    );
  }

  const fullName = userProfile.firstName && userProfile.lastName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : 'User Profile';
  const lastLoginText = userProfile.lastLoginAt
    ? new Date(userProfile.lastLoginAt).toLocaleDateString()
    : 'Never';

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Account Workspace</p>
              <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">Profile Settings</h1>
              <p className="text-muted">Manage your account information and security settings</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-line bg-wash px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Role</p>
                <p className="mt-1 font-semibold text-ink">{userProfile.role}</p>
              </div>
              <div className="rounded-xl border border-line bg-wash px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Last Login</p>
                <p className="mt-1 font-semibold text-ink">{lastLoginText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 flex items-center rounded-xl border border-paid-line bg-paid-soft px-4 py-3 text-paid">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-behind-line bg-behind-soft px-4 py-3 text-behind">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-8">
            {/* Basic Information */}
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-ink">
                <UserIcon className="mr-2 h-5 w-5" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-4 h-5 w-5 text-muted" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`${inputClassName} py-3 pl-10 pr-4`}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="mb-6 flex items-center text-lg font-semibold text-ink">
                <KeyIcon className="mr-2 h-5 w-5" />
                Change Password
              </h3>
              <p className="mb-6 text-sm text-muted">Leave blank if you don&apos;t want to change your password</p>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className={`${inputClassName} pr-12`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-3 text-muted transition-colors duration-200 hover:text-ink"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-ink">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className={`${inputClassName} pr-12`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-3 text-muted transition-colors duration-200 hover:text-ink"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-ink">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`${inputClassName} pr-12`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-3 text-muted transition-colors duration-200 hover:text-ink"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl border border-ink bg-ink px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
              >
                {saving ? (
                  <span className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-black"></div>
                    Updating...
                  </span>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>

          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full border border-line bg-ink p-2">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{fullName}</p>
                  <p className="text-xs text-muted">{userProfile.email}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-line pt-4">
                <div className="rounded-xl border border-line bg-wash px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Role</p>
                  <p className="mt-1 font-semibold text-ink">{userProfile.role}</p>
                </div>
                <div className="rounded-xl border border-line bg-wash px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Member Since</p>
                  <p className="mt-1 font-semibold text-ink">{new Date(userProfile.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border border-line bg-wash px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Last Login</p>
                  <p className="mt-1 font-semibold text-ink">{lastLoginText}</p>
                </div>
              </div>
            </div>

            <PushNotificationSettings />

            <div className="rounded-2xl border border-flag-line bg-flag-soft p-6">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-flag">Security Note</h4>
              <p className="mt-2 text-sm text-flag">
                Changing your password will sign you out automatically to protect your account session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}