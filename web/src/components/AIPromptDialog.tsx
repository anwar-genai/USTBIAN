'use client';

import { useState } from 'react';

interface AIPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

export function AIPromptDialog({ isOpen, onClose, onGenerate }: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
      setPrompt('');
    }
  };

  if (!isOpen) return null;

  const examplePrompts = [
    'Share my excitement about the weekend',
    'Talk about studying for exams',
    'Celebrate a recent achievement',
    'Ask for restaurant recommendations',
    'Share thoughts on campus life',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform animate-scaleIn">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <h3 className="text-xl font-semibold text-white">Generate Post with AI</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white hover:text-gray-200 transition"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to post about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Share my excitement about finishing a project..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-600 mb-2 font-medium">Quick examples:</p>
            <div className="space-y-2">
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  💡 {example}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

