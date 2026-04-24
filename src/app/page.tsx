'use client';

import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    const lines = [
      "INITIALIZING ZONE_OF_CONTROL CORE...",
      "LOADING NEURAL NETWORKING LAYER...",
      "ESTABLISHING SECURE TUNNEL...",
      "NEO-BRUTALIST RENDERER ACTIVE.",
      "READY FOR DOMINANCE."
    ];
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setBootLines(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = () => {
    const roomId = nanoid(10);
    router.push(`/room/${roomId}`);
  };

  if (isBooting) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono overflow-hidden">
        <div className="max-w-2xl w-full">
          <div className="text-[var(--accent-primary)] mb-8 text-xl font-bold animate-pulse">
            {'>'} BOOT_SEQUENCE
          </div>
          <div className="space-y-2">
            {bootLines.map((line, i) => (
              <div key={i} className="text-white/80 tracking-tighter uppercase leading-tight">
                <span className="text-[var(--accent-primary)] mr-4">[{i+1}]</span> {line}
              </div>
            ))}
          </div>
          <div className="mt-12 h-2 bg-zinc-900 w-full overflow-hidden border border-white/10">
            <div className="h-full bg-[var(--accent-primary)] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 font-sans overflow-hidden scanlines">
      <div className="max-w-6xl w-full text-center space-y-16 relative z-10">
        
        {/* Massive Cinematic Header */}
        <header className="relative inline-block">
          <div className="absolute -top-12 -left-12 w-24 h-24 border-t-8 border-l-8 border-[var(--accent-primary)]"></div>
          <div className="absolute -bottom-12 -right-12 w-24 h-24 border-b-8 border-r-8 border-[var(--accent-primary)]"></div>
          
          <div className="bg-black text-white p-16 brutalist-border brutalist-shadow-lg transform -rotate-1">
            <h1 className="massive-text font-black uppercase leading-[0.8] tracking-tighter">
              ZONE <br /> <span className="text-[var(--accent-primary)]">CONTROL</span>
            </h1>
          </div>
          
          <div className="mt-8 flex justify-center gap-4">
            <span className="bg-[var(--accent-secondary)] text-white px-6 py-2 font-black uppercase skew-x-[-12deg] text-sm">
              v2.0 MULTIPLAYER
            </span>
            <span className="bg-white text-black px-6 py-2 font-black uppercase skew-x-[12deg] text-sm brutalist-border">
              ALPHA STABLE
            </span>
          </div>
        </header>

        {/* Action Panel */}
        <div className="bg-white p-12 brutalist-border brutalist-shadow-lg max-w-2xl mx-auto transform rotate-1">
          <div className="mb-10 text-left">
            <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2 tracking-[0.3em]">Operational Protocol</span>
            <p className="text-black text-xl font-bold uppercase leading-tight italic">
              "Tactical dominance through brutalist architecture and real-time synchronized warfare."
            </p>
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full bg-black text-white px-12 py-8 text-4xl font-black uppercase border-[6px] border-black hover:bg-[var(--accent-primary)] hover:text-black transition-all hover:-translate-x-2 hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4 group"
          >
            <span>Initiate Combat</span>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-1 bg-black/10"></div>
            ))}
          </div>
        </div>

        {/* Bottom Specs */}
        <footer className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"></div>
            LATENCY: OPTIMIZED
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent-secondary)] rounded-full"></div>
            CORE: NEO-BRUTALIST
          </div>
        </footer>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-10 w-px h-64 bg-white/20"></div>
        <div className="absolute bottom-1/4 right-10 w-px h-64 bg-white/20"></div>
        <div className="absolute top-10 left-1/4 w-64 h-px bg-white/20"></div>
        <div className="absolute bottom-10 right-1/4 w-64 h-px bg-white/20"></div>
      </div>

      <style jsx>{`
        .massive-text {
          font-size: clamp(5rem, 15vw, 11rem);
        }
      `}</style>
    </main>
  );
}
