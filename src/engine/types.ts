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
  // Combat stats
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number; // in milliseconds
  lastAttackTime: number; // timestamp
  isAttacking: boolean;
  isTakingDamage: boolean;
  damageFlashTimer: number; // frames to flash
}

export type GameStatus = 'playing' | 'victory' | 'defeat';

export interface GameState {
  playerCastle: Castle;
  opponentCastle: Castle;
  troops: Troop[];
  gold: number;
  opponentGold: number;
  lastIncomeTime: number;
  lastAiDecisionTime: number;
  status: GameStatus;
  isPaused: boolean;
}
