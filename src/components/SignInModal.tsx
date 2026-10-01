import React, { useRef, useState } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        await update();
        handleClose();
        router.replace('/dashboard');
        window.location.assign('/dashboard');
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
        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-line bg-white p-8">
          <Dialog.Title className="mb-6 text-center text-2xl font-bold tracking-[-0.03em] text-ink">
            Sign In
          </Dialog.Title>
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-behind-line bg-behind-soft px-4 py-3 text-sm text-behind">
                {error}
              </div>
            )}
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full rounded-xl border border-line bg-white px-4 py-3 font-medium text-ink placeholder:text-muted transition-all duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full rounded-xl border border-line bg-white px-4 py-3 font-medium text-ink placeholder:text-muted transition-all duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
                disabled={isLoading}
              />
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button 
                type="submit"
                disabled={isLoading}
                onMouseDown={(e) => {
                  if (document.activeElement instanceof HTMLElement && document.activeElement !== e.currentTarget) {
                    document.activeElement.blur();
                  }
                }}
                onTouchStart={(e) => {
                  if (document.activeElement instanceof HTMLElement && document.activeElement !== e.currentTarget) {
                    document.activeElement.blur();
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink bg-ink px-6 py-3 font-bold text-white transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
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
                className="w-full rounded-xl border border-line bg-white px-6 py-3 font-bold text-ink transition-colors duration-200 hover:bg-wash disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{' '}
              <button className="font-medium text-ink hover:text-muted">
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
