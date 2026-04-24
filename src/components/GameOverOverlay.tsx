'use client';

import React from 'react';
import { GameStatus } from '../engine/types';

interface GameOverOverlayProps {
  status: GameStatus;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ status, onRestart, onExit }) => {
  if (status === 'playing') return null;

  const isVictory = status === 'victory';

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in zoom-in-95 duration-500">
      <div className="bg-black p-16 brutalist-border brutalist-shadow-lg text-center max-w-3xl w-full mx-4 relative overflow-hidden">
        {/* Animated Background Pulse */}
        <div className={`absolute inset-0 opacity-10 animate-pulse ${isVictory ? 'bg-[var(--accent-primary)]' : 'bg-[var(--accent-secondary)]'}`}></div>
        
        <div className="relative z-10">
          <div className="inline-block bg-white text-black px-6 py-2 text-sm font-black uppercase mb-8 transform -rotate-2">
            Engagement Terminated
          </div>
          
          <h2 className={`massive-text font-black uppercase leading-[0.7] tracking-tighter mb-10 ${isVictory ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-secondary)]'}`}>
            {status}
          </h2>
          
          <p className="text-2xl font-bold uppercase mb-16 text-white/60 font-mono tracking-tighter max-w-md mx-auto leading-tight">
            {isVictory 
              ? 'Opponent systems neutralized. Sector secured for command.' 
              : 'Our stronghold has collapsed. Initiating emergency extraction.'
            }
          </p>

          <div className="flex flex-col gap-6 max-w-sm mx-auto">
            <button
              onClick={onRestart}
              className={`w-full py-8 text-4xl font-black uppercase border-[6px] border-black brutalist-shadow hover:-translate-x-2 hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all ${
                isVictory ? 'bg-[var(--accent-primary)] text-black' : 'bg-white text-black'
              }`}
            >
              Restart
            </button>
            
            <button
              onClick={onExit}
              className="w-full bg-[#333] text-white py-4 text-xl font-bold uppercase border-[4px] border-black hover:bg-white hover:text-black transition-all"
            >
              Abandon Theater
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .massive-text {
          font-size: clamp(5rem, 18vw, 13rem);
        }
      `}</style>
    </div>
  );
};
