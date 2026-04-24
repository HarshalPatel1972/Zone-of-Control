'use client';

import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 500);
  }, []);

  const handleCreateRoom = () => {
    const roomId = nanoid(8);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-8 overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 scale-110 animate-[slowZoom_20s_infinite_alternate]"
        style={{ backgroundImage: "url('/assets/bg.png')" }}
      ></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none"></div>

      <div className={`relative z-10 max-w-4xl w-full transition-all duration-1000 transform ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        <div className="text-center space-y-12">
          <header className="space-y-4">
            <h1 className="game-title text-7xl md:text-9xl font-black uppercase text-[var(--gold)] drop-shadow-2xl">
              ZONE <br /> <span className="text-white">CONTROL</span>
            </h1>
            <div className="flex justify-center items-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-[var(--gold)]"></div>
              <p className="italic text-xl text-[var(--parchment)] opacity-80 uppercase tracking-[0.3em]">A Legend Reborn</p>
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-[var(--gold)]"></div>
            </div>
          </header>

          <div className="fancy-border p-12 max-w-xl mx-auto space-y-8 bg-[#2c1e0f]/80 backdrop-blur-md">
            <p className="text-[var(--parchment)] text-lg leading-relaxed italic opacity-90">
              "Gather your knights, ready your bows, and fortify your stronghold. The battle for supremacy has begun."
            </p>

            <button
              onClick={handleCreateRoom}
              className="w-full group relative py-6 bg-gradient-to-b from-[#D4AF37] to-[#8B6B00] text-[#1a0f00] text-3xl font-black uppercase rounded-sm shadow-2xl hover:brightness-125 transition-all active:scale-95"
            >
              <span className="relative z-10">Enter Battlefield</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 blur-xl"></div>
            </button>

            <Link
              href="/fun-zone"
              className="block w-full py-4 border-2 border-[var(--gold)] text-[var(--gold)] text-xl font-bold uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[#1a0f00] transition-all text-center"
            >
              Explore Fun Zone
            </Link>

            <div className="flex justify-center gap-6 text-sm font-bold uppercase tracking-widest text-[var(--gold)]">
              <span>Online PVP</span>
              <span className="opacity-30">|</span>
              <span>Castle Defense</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bg-radial-vignette {
          background: radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 100%);
        }
        @keyframes slowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </main>
  );
}
