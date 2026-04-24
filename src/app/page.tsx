'use client';

import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = nanoid(10);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="min-h-screen bg-[#F0F0F0] flex flex-col items-center justify-center p-8 font-mono">
      <div className="max-w-4xl w-full text-center space-y-12">
        <header className="bg-black text-white p-12 border-[8px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.4)]">
          <h1 className="massive-text font-black uppercase leading-none tracking-tighter">
            Zone of <br /> Control
          </h1>
          <p className="mt-8 text-xl font-bold uppercase underline decoration-white/40 tracking-widest italic">
            Neo-Brutalist Tactical Engine // v2.0 Multi
          </p>
        </header>

        <div className="bg-white p-16 border-[8px] border-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={handleCreateRoom}
            className="group relative bg-black text-white px-16 py-10 text-5xl font-black uppercase border-[8px] border-black hover:bg-white hover:text-black transition-all active:translate-x-3 active:translate-y-3 active:shadow-none shadow-[16px_16px_0px_0px_rgba(0,0,0,0.5)]"
          >
            Create Secure Room
            <span className="absolute -top-6 -right-6 bg-red-600 text-white text-base px-4 py-2 rotate-12 border-4 border-black group-hover:rotate-0 transition-transform">
              LIVE MULTIPLAYER
            </span>
          </button>

          <p className="mt-12 text-sm font-black uppercase opacity-40">
            Secure Encrypted Tunneling // Latency-Optimized Netcode
          </p>
        </div>

        <footer className="opacity-30 text-[10px] font-black uppercase tracking-[0.5em]">
          Designed for high-intensity strategic dominance
        </footer>
      </div>

      <style jsx>{`
        .massive-text {
          font-size: clamp(5rem, 18vw, 12rem);
        }
      `}</style>
    </main>
  );
}
