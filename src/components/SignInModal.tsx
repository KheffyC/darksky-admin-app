import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
    } catch {
      setError('An error occurred during sign in');
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
      <div className="fixed inset-0 bg-black/55" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-[#d6dde5] bg-white p-8">
          <Dialog.Title className="mb-6 text-center text-2xl font-bold tracking-[-0.03em] text-[#2C3E50]">
            Sign In
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-400 bg-rose-100 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            )}
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 font-medium text-[#2C3E50] placeholder:text-[#788896] transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 font-medium text-[#2C3E50] placeholder:text-[#788896] transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
                disabled={isLoading}
              />
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f38d68] bg-[#f38d68] px-6 py-3 font-bold text-black transition-colors duration-200 hover:bg-[#f5a07f] disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"></div>
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
                className="w-full rounded-xl border border-[#d6dde5] bg-white px-6 py-3 font-bold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
              >
                Cancel
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#788896]">
              Don&apos;t have an account?{' '}
              <button className="font-medium text-[#0D47A1] hover:text-[#1565c0]">
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
