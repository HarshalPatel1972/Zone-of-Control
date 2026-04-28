'use client';

import React, { useState } from 'react';

interface LobbyOverlayProps {
  roomId: string;
  isHost: boolean;
  onCopy: () => void;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({ roomId, isHost, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const lobbyUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(lobbyUrl);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel p-10 md:p-14 text-center max-w-xl w-full mx-4 rounded-[3rem] space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
        
        <div className="space-y-3">
          <h2 className="fancy-title text-4xl font-bold tracking-tight">
            Deploying <span className="text-white/40">Force</span>
          </h2>
          <p className="text-white/50 text-base font-light tracking-wide italic">
            "Strategy begins long before the first arrow is fired."
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <input
                type="text"
                readOnly
                value={lobbyUrl}
                className="glass-input pr-12 text-center text-xs font-mono tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={handleCopy}
              className="glass-button-primary w-full py-5 text-lg font-bold tracking-widest active:scale-[0.98]"
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  LINK COPIED
                </span>
              ) : 'INVITE OPPONENT'}
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" 
                  style={{ animationDelay: `${i * 200}ms` }}
                ></div>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Establishing Strategic Link...
            </span>
        </div>
      </div>
    </div>
  );
};

