"use client";

import { useEffect } from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  heading: string;
  message: string;
}

export default function InfoModal({ isOpen, onClose, heading, message }: InfoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">{heading}</h2>
          <div className="text-neutral-300 leading-relaxed whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-ink text-white px-6 py-2 rounded-lg hover:bg-ink-hover transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
