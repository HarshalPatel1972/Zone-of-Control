'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Team } from '@/engine/types';

export const useMultiplayer = (roomId: string, onEnemySpawn: (team: Team, type: string) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      socket.emit('join-room', roomId);
    });

    socket.on('start-game', () => {
      console.log('Opponent joined! Starting game...');
      setIsGameStarted(true);
    });

    socket.on('enemy-spawn', ({ team, type }) => {
      console.log('Enemy spawned:', type);
      onEnemySpawn(team, type);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendSpawn = (team: Team, type: string) => {
    if (socketRef.current) {
      socketRef.current.emit('spawn-troop', { roomId, team, type });
    }
  };

  return { isConnected, isGameStarted, sendSpawn };
};
