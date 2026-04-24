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
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="fancy-border p-12 text-center max-w-2xl w-full mx-4 space-y-8 bg-[#2c1e0f]/95 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        
        <div className="space-y-4">
          <h2 className="game-title text-5xl font-black uppercase text-[var(--gold)]">
            Seeking Allies
          </h2>
          <div className="h-1 w-24 bg-[var(--gold)] mx-auto opacity-50"></div>
          <p className="text-xl italic opacity-80">"Victory requires a worthy adversary. Send your herald to the neighboring kingdom."</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              readOnly
              value={lobbyUrl}
              className="w-full bg-[#1a0f00] text-[var(--gold)] p-4 text-center text-sm font-mono border-2 border-[#3d2b16] outline-none"
            />
            <button
              onClick={handleCopy}
              className="w-full py-4 bg-gradient-to-b from-[#D4AF37] to-[#8B6B00] text-[#1a0f00] font-black uppercase text-xl hover:brightness-110 active:scale-95 transition-all"
            >
              {copied ? 'Herald Sent!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-center items-center gap-2">
            <div className="w-3 h-3 bg-[var(--gold)] rounded-full animate-pulse"></div>
            <span className="text-sm font-bold uppercase tracking-widest opacity-60">Waiting for Opposition...</span>
        </div>
      </div>
    </div>
  );
};
