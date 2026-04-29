export type Team = 'player' | 'opponent';
export type CpuDifficulty = 'easy' | 'medium' | 'hard';

export interface Castle {
  health: number;
  maxHealth: number;
  secondaryHealth: number;
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
  health: number;
  maxHealth: number;
  secondaryHealth: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  isAttacking: boolean;
  isTakingDamage: boolean;
  damageFlashTimer: number;
  bobbingTimer: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: Team;
  damage: number;
  targetId?: string;
  type: 'arrow';
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
  life: number;
}

export interface GameState {
  playerCastle: Castle;
  opponentCastle: Castle;
  troops: Troop[];
  projectiles: Projectile[];
  particles: Particle[];
  gold: number;
  opponentGold: number;
  lastIncomeTime: number;
  lastAiDecisionTime: number;
  status: GameStatus;
  isPaused: boolean;
  isMultiplayer: boolean;
  screenShake: number;
  cpuDifficulty: CpuDifficulty;
}
