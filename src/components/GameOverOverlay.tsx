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
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl animate-fade-in px-4">
      <div className="glass-panel p-8 sm:p-20 text-center max-w-2xl w-full rounded-3xl sm:rounded-[4rem] space-y-6 sm:space-y-12 shadow-2xl border-white/10">
        
        <div className="space-y-3 sm:space-y-6">
          <h2 className={`fancy-title text-5xl sm:text-9xl font-black tracking-tighter ${isVictory ? '!text-success' : '!text-error'}`}>
            {status === 'victory' ? 'Victory' : 'Defeat'}
          </h2>
          <div className="flex justify-center items-center gap-4">
            <div className={`h-[1px] sm:h-[2px] w-8 sm:w-16 ${isVictory ? 'bg-success/30' : 'bg-error/30'}`}></div>
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/40">Operation Concluded</p>
            <div className={`h-[1px] sm:h-[2px] w-8 sm:w-16 ${isVictory ? 'bg-success/30' : 'bg-error/30'}`}></div>
          </div>
        </div>
        
        <p className="text-sm sm:text-2xl font-light text-white/70 leading-relaxed max-w-md mx-auto italic px-2">
          {isVictory 
            ? 'Strategic objective achieved. Your dominance over the sector is absolute.' 
            : 'Strategic failure. The sector has been compromised, but the war continues.'
          }
        </p>

        <div className="flex flex-col gap-3 sm:gap-5 max-w-sm mx-auto pt-4">
          <button
            onClick={onRestart}
            className={`w-full py-4 sm:py-6 text-base sm:text-xl font-bold tracking-widest uppercase rounded-xl sm:rounded-2xl shadow-2xl transition-all active:scale-95 ${
                isVictory 
                ? 'glass-button-primary' 
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            REDEPLOY
          </button>
          
          <button
            onClick={onExit}
            className="glass-button w-full py-4 text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white/80 border-white/5 hover:border-white/20"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>
    </div>
  );
};

