export type Team = 'player' | 'opponent';
export type CpuDifficulty = 'easy' | 'medium' | 'hard';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'storm';
export type AbilityType = 'meteor' | 'heal' | 'shield' | 'lightning' | 'superMeteor' | 'moon' | 'superHeal' | 'iceFreeze';
export type TroopType = 'basic' | 'archer' | 'berserker' | 'hero' | 'fire_archer' | 'crossman' | 'dragon' | 'angel' | 'tank' | 'super_monster';

export interface Castle {
  health: number;
  maxHealth: number;
  secondaryHealth: number;
  x: number;
  width: number;
  height: number;
  team: Team;
  level: number;
  turretLevel: number;
  lastTurretFire: number;
  activeShield: number; // duration left
}

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
  // Veteran System
  kills: number;
  rank: number; // 0 to 3
  state: 'idle' | 'advancing' | 'retreating';
  isFrozen: boolean;
  freezeTimer: number;
  lastSpecialTime: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: Team;
  damage: number;
  type: 'arrow' | 'fire_arrow' | 'bolt' | 'meteor';
}

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

export interface NeutralObjective {
  x: number;
  y: number;
  radius: number;
  control: number; // -100 (opponent) to 100 (player)
  owner: Team | 'neutral';
}

export interface MatchStats {
  goldEarned: number;
  troopsSpawned: number;
  kills: number;
  damageDealt: number;
}

export interface Emote {
  id: string;
  team: Team;
  type: string;
  life: number;
  x: number;
  y: number;
}

export type GameStatus = 'lobby' | 'playing' | 'victory' | 'defeat';

export interface GameState {
  mode: 'normal' | 'castle_wars' | 'super_castle_wars';
  playerCastle: Castle;
  opponentCastle: Castle;
  extraEnemyCastles: { id: string, x: number, health: number, maxHealth: number, status: 'alive' | 'destroyed' }[];
  troops: Troop[];
  projectiles: Projectile[];
  particles: Particle[];
  emotes: Emote[];
  objective: NeutralObjective;
  gold: number;
  opponentGold: number;
  lastIncomeTime: number;
  lastAiDecisionTime: number;
  status: GameStatus;
  isPaused: boolean;
  isMultiplayer: boolean;
  screenShake: number;
  cpuDifficulty: CpuDifficulty;
  weather: WeatherType;
  weatherTimer: number;
  playerAbilities: Record<AbilityType, { cooldown: number, lastUsed: number }>;
  opponentAbilities: Record<AbilityType, { cooldown: number, lastUsed: number }>;
  stats: Record<Team, MatchStats>;
  cameraX: number;
  isAutoCamera: boolean;
  lastManualScroll: number;
}
