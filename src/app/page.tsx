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

  const handleCreateRoom = () => {
    const roomId = nanoid(8);
    router.push(`/room/${roomId}`);
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

      <div className={`relative z-10 max-w-4xl w-full flex flex-col items-center transition-all duration-1000 ease-out ${isReady ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* Header Section */}
        <div className="text-center space-y-2 mb-16">
          <h1 className="fancy-title text-6xl md:text-8xl tracking-tight leading-none mb-4">
            Zone <br /> <span className="opacity-90">Control</span>
          </h1>
          <div className="flex justify-center items-center gap-6">
            <div className="h-px w-12 bg-white/20"></div>
            <p className="text-sm font-medium text-white/40 uppercase tracking-[0.4em]">Tactical Dominion</p>
            <div className="h-px w-12 bg-white/20"></div>
          </div>
        </div>

        {/* Action Card */}
        <div className="glass-panel p-10 md:p-14 w-full max-w-lg rounded-[2.5rem] flex flex-col gap-10 animate-fade-in shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="space-y-4 text-center">
            <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
              Master the art of <span className="text-gold font-medium">strategic defense</span> and expand your territory in real-time combat.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              className="glass-button-primary w-full py-5 text-xl tracking-wide flex items-center justify-center gap-3 active:scale-[0.97]"
            >
              <span>ENTER BATTLEFIELD</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <Link
              href="/fun-zone"
              className="glass-button w-full text-white/90 text-center block py-4 text-sm font-semibold tracking-widest hover:text-white"
            >
              EXPLORE FUN ZONE
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4 border-t border-white/5">
            {[
              { label: 'Online PVP', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { label: 'Real-time', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Strategy', icon: 'M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.605 4c-1.31 0-2.52.5-3.418 1.403a3.323 3.323 0 00-1.403 3.418c.184 1.15-.316 2.302-1.233 3.036a3.323 3.323 0 00-1.157 3.655l1.082 3.244a3.323 3.323 0 003.655 1.157l3.244-1.082a3.323 3.323 0 003.036 1.233 3.323 3.323 0 003.418-1.403 3.323 3.323 0 001.403-3.418c-.184-1.15.316-2.302 1.233-3.036a3.323 3.323 0 001.157-3.655l-1.082-3.244z' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
                {feature.label}
              </div>
            ))}
          </div>
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

