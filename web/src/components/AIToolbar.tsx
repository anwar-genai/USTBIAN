'use client';

import { useState } from 'react';

interface AIToolbarProps {
  onGenerate: () => void;
  onEnhance: (tone?: 'professional' | 'casual' | 'friendly' | 'humorous') => void;
  onShorten: () => void;
  disabled?: boolean;
  hasText: boolean;
}

export function AIToolbar({ onGenerate, onEnhance, onShorten, disabled = false, hasText }: AIToolbarProps) {
  const [showToneMenu, setShowToneMenu] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <span className="font-medium">AI Assistant</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Generate post from prompt"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowToneMenu(!showToneMenu)}
            disabled={disabled || !hasText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Enhance with different tones"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Enhance
          </button>

          {showToneMenu && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
              <button
                type="button"
                onClick={() => {
                  onEnhance();
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                ✨ Auto
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnhance('professional');
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                💼 Professional
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnhance('casual');
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                😎 Casual
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnhance('friendly');
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                🤗 Friendly
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnhance('humorous');
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
              >
                😄 Humorous
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onShorten}
          disabled={disabled || !hasText}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Shorten text to fit limit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Shorten
        </button>
      </div>
    </div>
  );
}

