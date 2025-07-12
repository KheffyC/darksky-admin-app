import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
            
      // Check for error first, even if ok is true
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        await update(); // Update session state
        router.push('/dashboard');
        onClose();
      }
    } catch (error) {
      setError('An error occurred during sign in');
      if (error instanceof AuthError) {
        return redirect(`/dashboard`)
      }
      throw error; // Let the error handling in the app handle redirects
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };
  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-600">
          <Dialog.Title className="text-2xl font-bold text-white mb-6 text-center">
            Sign In
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-600/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold border border-gray-400/30 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <button className="text-blue-400 hover:text-blue-300 font-medium">
                Contact Administrator
              </button>
            </p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SignInModal;
