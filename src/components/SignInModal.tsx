import React from 'react';
import { Dialog } from '@headlessui/react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-600">
          <Dialog.Title className="text-2xl font-bold text-white mb-6 text-center">
            Sign In
          </Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email..."
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password..."
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg">
              Sign In
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold border border-gray-400/30"
            >
              Cancel
            </button>
          </div>
          
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
