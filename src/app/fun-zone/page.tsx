'use client';

import Link from 'next/link';

export default function FunZonePage() {
  const games = [
    { name: 'Alchemy', file: 'alchemy.html' },
    { name: 'Flow', file: 'flow.html' },
    { name: 'Lightning', file: 'lightning.html' },
    { name: 'Mesh', file: 'mesh.html' },
    { name: 'Observer', file: 'observer.html' },
    { name: 'Prism', file: 'prism.html' },
    { name: 'Silk', file: 'silk.html' },
    { name: 'Vortex', file: 'vortex.html' },
    { name: 'Wrapping', file: 'wrapping.html' },
  ];

  return (
    <main className="min-h-screen bg-[#1a0f00] p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12 relative z-10">
        
        <header className="text-center space-y-4">
          <Link href="/" className="text-[var(--gold)] uppercase font-bold tracking-widest hover:underline">
            ← Back to War
          </Link>
          <h1 className="game-title text-7xl font-black uppercase text-[var(--gold)]">
            FUN <span className="text-white">ZONE</span>
          </h1>
          <p className="italic text-xl text-[var(--parchment)] opacity-60">Extra-dimensional diversions for weary commanders.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <a
              key={game.file}
              href={`/fun-zone/${game.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fancy-border p-8 text-center hover:scale-105 transition-all bg-[#2c1e0f]/80 backdrop-blur-md group"
            >
              <h3 className="text-2xl font-bold uppercase mb-2 text-[var(--gold)] group-hover:text-white transition-colors">
                {game.name}
              </h3>
              <span className="text-xs uppercase tracking-widest opacity-40">Open Experiment</span>
            </a>
          ))}
        </div>
      </div>

      {/* Background Decorative */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/assets/bg.png')" }}
      ></div>
    </main>
  );
}
