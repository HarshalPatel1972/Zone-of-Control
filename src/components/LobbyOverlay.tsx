'use client';

import React, { useState } from 'react';
import { GameMode } from '@/engine/types';

interface LobbyOverlayProps {
  roomId: string;
  isHost: boolean;
  onCopy: () => void;
  onStartCpu: (diff: 'easy' | 'medium' | 'hard', mode: GameMode) => void;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({ onCopy, onStartCpu }) => {
  const [copied, setCopied] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedMapMode, setSelectedMapMode] = useState<GameMode>('normal');
  const lobbyUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(lobbyUrl);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel p-8 sm:p-14 text-center max-w-xl w-full mx-4 rounded-3xl sm:rounded-[3rem] space-y-6 sm:space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
        
        <div className="space-y-2 sm:space-y-3">
          <h2 className="fancy-title text-3xl sm:text-4xl font-bold tracking-tight">
            Deploying <span className="text-white/40">Force</span>
          </h2>
          <p className="text-white/50 text-sm sm:text-base font-light tracking-wide italic">
            &quot;Strategy begins long before the first arrow is fired.&quot;
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={handleCopy}
              className="glass-button-primary w-full py-5 text-lg font-bold tracking-widest active:scale-[0.98]"
            >
              {copied ? 'LINK COPIED' : 'INVITE OPPONENT'}
            </button>
            
            <div className="relative flex items-center gap-2 pt-4">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">OR PRACTICE</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="flex gap-2 justify-center py-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${
                    difficulty === d ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="relative flex items-center gap-2 pt-2">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">MAP MODE</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="flex flex-col gap-2 py-2">
                {(['normal', 'castle_wars', 'super_castle_wars', 'dark_age'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setSelectedMapMode(m)}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                          selectedMapMode === m ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/60 hover:border-gold/50'
                        }`}
                    >
                        {m.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            <button
              onClick={() => onStartCpu(difficulty, selectedMapMode)}
              className="glass-button w-full py-4 text-sm font-bold tracking-widest hover:bg-white/10 transition-colors"
            >
              START TRAINING
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


