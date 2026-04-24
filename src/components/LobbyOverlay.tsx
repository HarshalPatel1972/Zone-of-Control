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
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="bg-white p-12 border-[10px] border-black shadow-[30px_30px_0px_0px_rgba(255,255,255,0.2)] text-center max-w-3xl w-full mx-4">
        <div className="mb-12">
          <h2 className="text-7xl font-black uppercase leading-none tracking-tighter mb-4 animate-pulse">
            Waiting for Connection
          </h2>
          <div className="h-4 bg-black w-full overflow-hidden">
            <div className="h-full bg-white w-1/3 animate-[slide_2s_infinite_linear]" style={{
              animation: 'slide 2s infinite linear'
            }}></div>
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-xl font-bold uppercase border-b-4 border-black pb-4 text-left">
            Share this link to recruit your opponent:
          </p>

          <div className="flex gap-0 border-[6px] border-black">
            <input
              type="text"
              readOnly
              value={lobbyUrl}
              className="flex-1 bg-[#EEE] p-6 text-lg font-mono outline-none border-r-[6px] border-black"
            />
            <button
              onClick={handleCopy}
              className={`px-10 font-black uppercase transition-all flex items-center justify-center min-w-[200px] ${
                copied ? 'bg-white text-black' : 'bg-black text-white hover:invert'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="text-left">
              <span className="block text-xs font-black uppercase opacity-50 mb-2">Room Identifier</span>
              <span className="text-3xl font-black uppercase">{roomId}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-black uppercase opacity-50 mb-2">Protocol</span>
              <span className="text-3xl font-black uppercase">Socket.IO / P2P</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
