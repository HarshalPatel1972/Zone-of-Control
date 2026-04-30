'use client';

import React, { useEffect, useRef } from 'react';
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/GameEngine';

interface GameCanvasProps {
  engine: GameEngine;
  onClick?: (x: number, y: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      engine.update();
      engine.render(ctx);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    // Scale the movement based on the ratio between canvas internal size and display size
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
        const scaleX = 1600 / rect.width;
        engine.setCameraX(engine.getState().cameraX - dx * scaleX);
    }
    lastX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging.current) {
        isDragging.current = false;
        return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && onClick) {
        const scaleX = 1600 / rect.width;
        const x = (e.clientX - rect.left) * scaleX + engine.getState().cameraX;
        const y = (e.clientY - rect.top) * (900 / rect.height);
        onClick(x, y);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#09090b]">
      <canvas
        ref={canvasRef}
        width={1600}
        height={900}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => isDragging.current = false}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
