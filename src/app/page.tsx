'use client';

import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const [targetRoomId, setTargetRoomId] = useState('');
  const [trainingDiff, setTrainingDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [mapMode, setMapMode] = useState<'normal' | 'castle_wars' | 'super_castle_wars'>('normal');

  const handleCreateRoom = () => {
    const roomId = nanoid(8);
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRoomId.trim()) {
      router.push(`/room/${targetRoomId.trim()}`);
    }
  };

  const handleStartTraining = () => {
    const roomId = 'training-' + nanoid(4);
    // Pass settings via search params so RoomPage can initialize correctly
    router.push(`/room/${roomId}?mode=${mapMode}&diff=${trainingDiff}&training=true`);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#09090b]">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 scale-110 animate-[slowZoom_30s_infinite_alternate] transition-opacity duration-1000"
        style={{ 
          backgroundImage: "url('/assets/bg.png')",
          filter: 'blur(2px) brightness(0.7)'
        }}
      ></div>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#09090b_100%)] pointer-events-none opacity-80"></div>

      <div className={`relative z-10 max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ease-out ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* Left Side: Brand & Mission */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <h1 className="fancy-title text-7xl md:text-9xl tracking-tight leading-none">
              Zone <br /> <span className="opacity-90">Control</span>
            </h1>
            <div className="flex justify-center lg:justify-start items-center gap-6">
              <div className="h-px w-12 bg-white/20"></div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-[0.4em]">Tactical Dominion</p>
            </div>
          </div>
          
          <p className="text-xl text-white/60 max-w-lg leading-relaxed font-light">
            Deploy your forces, manage your treasury, and crush the opposition in this <span className="text-gold font-medium italic">Neo-Brutalist</span> tactical engine.
          </p>

          <div className="flex flex-wrap gap-6 pt-4 justify-center lg:justify-start">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
               <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
               Signaling Server Online
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
               <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
               v2.0 Tactical Engine
             </div>
          </div>
        </div>

        {/* Right Side: Deployment Panels */}
        <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
          
          {/* PVP PANEL */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold mb-6 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-gold" />
               Online Multiplayer
            </h3>

            <div className="space-y-4">
              <button onClick={handleCreateRoom} className="glass-button-primary w-full py-4 text-lg tracking-widest flex items-center justify-center gap-3 group/btn">
                <span>CREATE SECTOR</span>
                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>

              <form onSubmit={handleJoinRoom} className="relative group/input">
                <input 
                  type="text" 
                  placeholder="ENTER SECTOR ID" 
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-gold font-bold tracking-widest placeholder:text-white/10 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all uppercase"
                />
                <button type="submit" disabled={!targetRoomId.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gold disabled:opacity-0 transition-opacity">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </form>
            </div>
          </div>

          {/* TRAINING PANEL */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-white/20" />
               Training Grounds
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button 
                    key={d} 
                    onClick={() => setTrainingDiff(d)}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${trainingDiff === d ? 'bg-white/10 border-white/40 text-white' : 'border-white/5 text-white/20 hover:border-white/20'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {(['normal', 'castle_wars', 'super_castle_wars'] as const).map(m => (
                  <button 
                    key={m} 
                    onClick={() => setMapMode(m)}
                    className={`w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border text-left flex justify-between items-center transition-all ${mapMode === m ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_20px_rgba(226,183,89,0.1)]' : 'border-white/5 text-white/30 hover:border-white/10'}`}
                  >
                    {m.replace(/_/g, ' ')}
                    {mapMode === m && <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_10px_#e2b759]" />}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleStartTraining}
                className="glass-button w-full py-4 text-sm font-black tracking-[0.2em] uppercase bg-white/5 hover:bg-white/10 text-white/80 transition-all border-white/10"
              >
                INITIATE TRAINING
              </button>
            </div>
          </div>

          <Link
            href="/fun-zone"
            className="w-full text-center py-4 text-[10px] font-bold tracking-[0.5em] uppercase text-white/20 hover:text-white/60 transition-colors"
          >
            ENTER THE FUN ZONE
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slowZoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.15); }
        }
      `}</style>
    </main>
  );
}

