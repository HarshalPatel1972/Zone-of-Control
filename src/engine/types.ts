export type Team = 'player' | 'opponent';

export interface Castle {
  health: number;
  maxHealth: number;
  x: number;
  width: number;
  height: number;
  team: Team;
}

export interface Troop {
  id: string;
  x: number;
  y: number;
  speed: number;
  team: Team;
  size: number;
  color: string;
}

export interface GameState {
  playerCastle: Castle;
  opponentCastle: Castle;
  troops: Troop[];
  isPaused: boolean;
}
