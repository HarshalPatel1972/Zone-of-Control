export type Team = 'player' | 'opponent';

export interface Castle {
  health: number;
  maxHealth: number;
  x: number;
  width: number;
  height: number;
  team: Team;
  level: number;
}

export type TroopType = 'basic' | 'archer' | 'berserker';

export interface Troop {
  id: string;
  x: number;
  y: number;
  type: TroopType;
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

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number; // 1.0 to 0.0
}

export interface GameState {
  playerCastle: Castle;
  opponentCastle: Castle;
  troops: Troop[];
  particles: Particle[];
  gold: number;
  opponentGold: number;
  lastIncomeTime: number;
  lastAiDecisionTime: number;
  status: GameStatus;
  isPaused: boolean;
  isMultiplayer: boolean;
  screenShake: number; // intensity
}
