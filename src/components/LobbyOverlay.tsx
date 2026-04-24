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
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-700">
      <div className="bg-[#111] p-12 border-[8px] border-black shadow-[30px_30px_0px_0px_rgba(0,0,0,0.5)] text-center max-w-3xl w-full mx-4 relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-[var(--accent-primary)]"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-[var(--accent-primary)]"></div>

        <div className="mb-12">
          <div className="inline-block bg-[var(--accent-primary)] text-black px-4 py-1 text-xs font-black uppercase mb-4 tracking-widest">
            Protocol: SECURE_TUNNEL
          </div>
          <h2 className="text-6xl font-black uppercase leading-none tracking-tighter text-white mb-6">
            Establishing <br /> Connection
          </h2>
          <div className="h-6 bg-black w-full brutalist-border p-1">
            <div className="h-full bg-[var(--accent-primary)] animate-[progress_1.5s_infinite_linear]"></div>
          </div>
        </div>

        <div className="space-y-8 bg-white/5 p-8 border-[4px] border-white/10">
          <p className="text-lg font-bold uppercase text-white/60 tracking-wider">
            Share transmission link to recruit opposition:
          </p>

          <div className="flex flex-col sm:flex-row gap-0 brutalist-border brutalist-shadow">
            <input
              type="text"
              readOnly
              value={lobbyUrl}
              className="flex-1 bg-black text-white p-6 text-sm font-mono outline-none border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-black"
            />
            <button
              onClick={handleCopy}
              className={`px-10 py-6 font-black uppercase transition-all flex items-center justify-center min-w-[200px] text-xl ${
                copied ? 'bg-[var(--accent-primary)] text-black' : 'bg-white text-black hover:bg-[var(--accent-primary)]'
              }`}
            >
              {copied ? 'Link Active' : 'Copy Signal'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="text-left border-l-4 border-[var(--accent-primary)] pl-4">
              <span className="block text-[10px] font-black uppercase text-white/30 mb-1 tracking-widest">Room ID</span>
              <span className="text-3xl font-black uppercase text-white font-mono">{roomId.substring(0, 8)}</span>
            </div>
            <div className="text-right border-r-4 border-[var(--accent-primary)] pr-4">
              <span className="block text-[10px] font-black uppercase text-white/30 mb-1 tracking-widest">Status</span>
              <span className="text-3xl font-black uppercase text-[var(--accent-primary)] animate-pulse">Scanning</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 40%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};
