'use client';

import React from 'react';
import { GameStatus } from '../engine/types';

interface GameOverOverlayProps {
  status: GameStatus;
  onRestart: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ status, onRestart }) => {
  if (status === 'playing') return null;

  const isVictory = status === 'victory';

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white p-12 border-[10px] border-black shadow-[20px_20px_0px_0px_rgba(255,255,255,0.3)] text-center max-w-2xl w-full mx-4">
        <h2 className={`massive-text font-black uppercase leading-none tracking-tighter mb-8 ${isVictory ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </h2>
        
        <p className="text-xl font-bold uppercase mb-12 border-y-4 border-black py-4">
          {isVictory ? 'The enemy stronghold has fallen.' : 'Our defense has been breached.'}
        </p>

        <button
          onClick={onRestart}
          className="bg-black text-white px-16 py-6 text-4xl font-black uppercase border-[6px] border-black hover:bg-white hover:text-black transition-all active:translate-x-2 active:translate-y-2 active:shadow-none shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)]"
        >
          Restart
        </button>
      </div>

      <style jsx>{`
        .massive-text {
          font-size: clamp(4rem, 15vw, 10rem);
        }
      `}</style>
    </div>
  );
};
