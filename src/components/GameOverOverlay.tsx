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
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
      <div className="fancy-border p-16 text-center max-w-2xl w-full mx-4 space-y-10 bg-[#2c1e0f]/95 animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        <div className="space-y-4">
          <h2 className={`game-title text-8xl font-black uppercase drop-shadow-2xl ${isVictory ? 'text-[var(--victory-green)]' : 'text-[var(--defeat-red)]'}`}>
            {status === 'victory' ? 'Victory' : 'Defeat'}
          </h2>
          <div className={`h-1 w-48 mx-auto opacity-50 ${isVictory ? 'bg-[var(--victory-green)]' : 'bg-[var(--defeat-red)]'}`}></div>
        </div>
        
        <p className="text-2xl font-bold italic opacity-90 leading-relaxed max-w-md mx-auto">
          {isVictory 
            ? 'The enemy has been vanquished. Your kingdom flourishes in the light of triumph.' 
            : 'Your stronghold has crumbled. The banners have fallen, but the legend remains.'
          }
        </p>

        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <button
            onClick={onRestart}
            className={`w-full py-6 text-3xl font-black uppercase rounded-sm shadow-2xl hover:brightness-125 transition-all active:scale-95 ${
                isVictory 
                ? 'bg-gradient-to-b from-[#D4AF37] to-[#8B6B00] text-[#1a0f00]' 
                : 'bg-zinc-200 text-black'
            }`}
          >
            Play Again
          </button>
          
          <button
            onClick={onExit}
            className="w-full py-4 bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Return to Hall
          </button>
        </div>
      </div>
    </div>
  );
};
