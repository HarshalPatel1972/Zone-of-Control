import { GameState, Troop, Castle, Team, Particle, TroopType, CpuDifficulty, Projectile, AbilityType, WeatherType, Emote, MatchStats } from './types';

export const CANVAS_WIDTH = 6000; 
export const CANVAS_HEIGHT = 900;
export const VIEW_WIDTH = 1600;

export const TROOP_STATS = {
  BASIC: { cost: 20, health: 150, attackDamage: 15, attackRange: 50, attackCooldown: 900, speed: 2.8, size: 55, asset: 'knight', maxCount: 20 },
  ARCHER: { cost: 45, health: 100, attackDamage: 30, attackRange: 450, attackCooldown: 1500, speed: 2.2, size: 55, asset: 'archer', maxCount: 15 },
  BERSERKER: { cost: 75, health: 450, attackDamage: 55, attackRange: 60, attackCooldown: 750, speed: 3.5, size: 70, asset: 'berserker', maxCount: 10 },
  HERO: { cost: 300, health: 1500, attackDamage: 80, attackRange: 80, attackCooldown: 600, speed: 4.0, size: 85, asset: 'hero', maxCount: 1 },
  FIRE_ARCHER: { cost: 100, health: 150, attackDamage: 45, attackRange: 500, attackCooldown: 1800, speed: 2.0, size: 60, asset: 'archer', maxCount: 8 },
  CROSSMAN: { cost: 120, health: 250, attackDamage: 70, attackRange: 350, attackCooldown: 2200, speed: 1.8, size: 65, asset: 'archer', maxCount: 6 },
  DRAGON: { cost: 500, health: 2500, attackDamage: 150, attackRange: 150, attackCooldown: 2000, speed: 3.0, size: 130, asset: 'dragon', maxCount: 2 },
  ANGEL: { cost: 400, health: 1200, attackDamage: 50, attackRange: 400, attackCooldown: 1200, speed: 4.8, size: 100, asset: 'angel', maxCount: 3 },
  TANK: { cost: 250, health: 5000, attackDamage: 25, attackRange: 40, attackCooldown: 1200, speed: 1.4, size: 110, asset: 'tank', maxCount: 5 }
};

export const CASTLE_UPGRADES = {
  2: { cost: 200, healthBoost: 500, incomeBoost: 5 },
  3: { cost: 500, healthBoost: 1000, incomeBoost: 10 },
};

interface VisualEffect {
    id: string;
    type: 'lightning' | 'moon' | 'ice' | 'shockwave' | 'fire_breath';
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
    points?: {x: number, y: number}[];
}

export class GameEngine {
  private state: GameState;
  private assets: Record<string, HTMLImageElement> = {};
  private assetsLoaded: boolean = false;
  private visualEffects: VisualEffect[] = [];

  constructor() {
    this.state = this.getInitialState();
    this.loadAssets();
  }

  private loadAssets() {
    const assetNames = ['bg', 'knight', 'archer', 'berserker', 'castle', 'dragon', 'angel', 'tank', 'hero'];
    let loadedCount = 0;
    assetNames.forEach(name => {
      const img = new Image();
      img.src = `/assets/${name}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === assetNames.length) this.assetsLoaded = true;
      };
      this.assets[name] = img;
    });
  }

  private getInitialState(): GameState {
    const abilityInit = {
      meteor: { cooldown: 12000, lastUsed: 0 },
      heal: { cooldown: 15000, lastUsed: 0 },
      shield: { cooldown: 25000, lastUsed: 0 },
      lightning: { cooldown: 8000, lastUsed: 0 },
      superMeteor: { cooldown: 40000, lastUsed: 0 },
      moon: { cooldown: 30000, lastUsed: 0 },
      superHeal: { cooldown: 50000, lastUsed: 0 },
      iceFreeze: { cooldown: 20000, lastUsed: 0 }
    };
    const statInit = { goldEarned: 150, troopsSpawned: 0, kills: 0, damageDealt: 0 };

    return {
      mode: 'normal',
      playerCastle: { health: 1200, maxHealth: 1200, secondaryHealth: 1200, x: 100, width: 250, height: 400, team: 'player', level: 1, turretLevel: 0, lastTurretFire: 0, activeShield: 0 },
      opponentCastle: { health: 1200, maxHealth: 1200, secondaryHealth: 1200, x: 4000 - 350, width: 250, height: 400, team: 'opponent', level: 1, turretLevel: 0, lastTurretFire: 0, activeShield: 0 },
      extraEnemyCastles: [],
      troops: [], projectiles: [], particles: [], emotes: [],
      objective: { x: 2000, y: CANVAS_HEIGHT - 100, radius: 100, control: 0, owner: 'neutral' },
      gold: 200, opponentGold: 200,
      lastIncomeTime: Date.now(), lastAiDecisionTime: Date.now(),
      status: 'playing', isPaused: false, isMultiplayer: false, screenShake: 0,
      cpuDifficulty: 'medium', weather: 'clear', weatherTimer: Date.now(),
      playerAbilities: { ...abilityInit }, opponentAbilities: { ...abilityInit },
      stats: { player: { ...statInit }, opponent: { ...statInit } },
      cameraX: 0, isAutoCamera: true, lastManualScroll: 0
    };
  }

  public setMode(mode: 'normal' | 'castle_wars' | 'super_castle_wars') {
    this.state.mode = mode;
    if (mode === 'castle_wars') {
        this.state.opponentCastle.x = 2000 - 350;
        this.state.extraEnemyCastles = [
            { id: 'castle2', x: 4000 - 350, health: 2000, maxHealth: 2000, status: 'alive' },
            { id: 'castle3', x: 6000 - 350, health: 3500, maxHealth: 3500, status: 'alive' }
        ];
    } else if (mode === 'super_castle_wars') {
        this.state.playerCastle.maxHealth = 5000;
        this.state.playerCastle.health = 5000;
        this.state.playerCastle.secondaryHealth = 5000;
        this.state.playerCastle.width = 400;
        this.state.playerCastle.height = 600;

        this.state.opponentCastle.maxHealth = 5000;
        this.state.opponentCastle.health = 5000;
        this.state.opponentCastle.secondaryHealth = 5000;
        this.state.opponentCastle.width = 400;
        this.state.opponentCastle.height = 600;
    }
  }

  public reset() {
    const mode = this.state.mode;
    this.state = this.getInitialState();
    this.setMode(mode);
    this.visualEffects = [];
  }

  public setMultiplayer(enabled: boolean) { this.state.isMultiplayer = enabled; }
  public setCpuDifficulty(diff: CpuDifficulty) { this.state.cpuDifficulty = diff; }
  public getState(): GameState { return { ...this.state }; }
  public setCameraX(x: number) { 
    const maxScroll = this.state.mode === 'castle_wars' ? 6000 - 1600 : 4000 - 1600;
    this.state.cameraX = Math.max(0, Math.min(maxScroll, x));
    this.state.isAutoCamera = false;
    this.state.lastManualScroll = Date.now();
  }

  public upgradeCastle(team: Team) {
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    const nextLevel = (castle.level + 1) as 2 | 3;
    const upgrade = CASTLE_UPGRADES[nextLevel];
    if (!upgrade) return;
    const gold = team === 'player' ? this.state.gold : this.state.opponentGold;
    if (gold < upgrade.cost) return;
    if (team === 'player') this.state.gold -= upgrade.cost;
    else this.state.opponentGold -= upgrade.cost;
    castle.level = nextLevel;
    castle.maxHealth += upgrade.healthBoost;
    castle.health += upgrade.healthBoost;
    castle.secondaryHealth = castle.health;
  }

  public spawnTroop(team: Team, type: TroopType = 'basic') {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
    const currentCount = this.state.troops.filter(t => t.team === team && t.type === type).length;
    if (currentCount >= stats.maxCount) return;
    const gold = team === 'player' ? this.state.gold : this.state.opponentGold;
    if (gold < stats.cost) return;

    if (team === 'player') this.state.gold -= stats.cost;
    else this.state.opponentGold -= stats.cost;
    this.createTroop(team, type);
  }

  public useAbility(team: Team, type: AbilityType, targetX?: number) {
    const abilities = team === 'player' ? this.state.playerAbilities : this.state.opponentAbilities;
    const ability = abilities[type];
    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) return;

    ability.lastUsed = now;
    const x = targetX ?? (team === 'player' ? (this.state.mode === 'castle_wars' ? 5000 : 3000) : 500);

    if (type === 'meteor') {
      const meteorVX = team === 'player' ? 8 : -8;
      for (let i = 0; i < 8; i++) {
        this.state.projectiles.push({
          id: Math.random().toString(), 
          x: x - (team === 'player' ? 400 : -400) + (Math.random() - 0.5) * 300, 
          y: -400 - (i * 100),
          vx: meteorVX + (Math.random() - 0.5) * 2, vy: 20, team, damage: 120, type: 'meteor'
        });
      }
      this.state.screenShake = 40;
    } else if (type === 'superMeteor') {
      const meteorVX = team === 'player' ? 10 : -10;
      for (let i = 0; i < 15; i++) {
        this.state.projectiles.push({
          id: Math.random().toString(), 
          x: x - (team === 'player' ? 600 : -600) + (Math.random() - 0.5) * 600, 
          y: -600 - (i * 100),
          vx: meteorVX + (Math.random() - 0.5) * 3, vy: 25, team, damage: 250, type: 'meteor'
        });
      }
      this.state.screenShake = 80;
    } else if (type === 'lightning') {
        const points = [{x: x, y: 0}];
        let curY = 0;
        let curX = x;
        while(curY < CANVAS_HEIGHT - 100) {
            curY += 50 + Math.random() * 50;
            curX += (Math.random() - 0.5) * 100;
            points.push({x: curX, y: curY});
        }
        this.visualEffects.push({ id: Math.random().toString(), type: 'lightning', x, y: 0, life: 1, maxLife: 1, color: '#64D2FF', points });
        this.state.troops.filter(t => t.team !== team && Math.abs(t.x - x) < 200).forEach(t => {
            t.health -= 500;
            this.spawnImpactParticles(t.x, t.y - 100, '#64D2FF');
        });
        this.state.screenShake = 30;
    } else if (type === 'heal') {
      this.state.troops.filter(t => t.team === team && Math.abs(t.x - x) < 400).forEach(t => {
        t.health = Math.min(t.maxHealth, t.health + 150);
        this.spawnImpactParticles(t.x, t.y - 40, '#32D74B');
      });
    } else if (type === 'superHeal') {
        this.visualEffects.push({ id: Math.random().toString(), type: 'shockwave', x, y: CANVAS_HEIGHT - 100, life: 1, maxLife: 1, color: '#32D74B' });
        this.state.troops.filter(t => t.team === team).forEach(t => { t.health = t.maxHealth; this.spawnImpactParticles(t.x, t.y - 40, '#32D74B'); });
        const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
        castle.health = Math.min(castle.maxHealth, castle.health + 500);
    } else if (type === 'shield') {
      const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
      castle.activeShield = 10000; 
    } else if (type === 'iceFreeze') {
        this.visualEffects.push({ id: Math.random().toString(), type: 'ice', x, y: CANVAS_HEIGHT - 100, life: 1, maxLife: 1, color: '#64D2FF' });
        const targetTeam = team === 'player' ? 'opponent' : 'player';
        this.state.troops.forEach(t => {
            if (t.team === targetTeam && Math.abs(t.x - x) < 500) {
                t.isFrozen = true; t.freezeTimer = 6000;
                this.spawnImpactParticles(t.x, t.y - 40, '#64D2FF');
            }
        });
    } else if (type === 'moon') {
        this.visualEffects.push({ id: Math.random().toString(), type: 'moon', x, y: 300, life: 1, maxLife: 1, color: '#BF5AF2' });
        this.state.troops.filter(t => t.team !== team && Math.abs(t.x - x) < 600).forEach(t => {
            t.x += (x - t.x) * 0.4; 
            t.health -= 80;
        });
        this.state.screenShake = 20;
    }
  }

  public triggerEmote(team: Team, type: string) {
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    this.state.emotes.push({
      id: Math.random().toString(), team, type, life: 1.0,
      x: castle.x + castle.width/2, y: CANVAS_HEIGHT - castle.height - 150
    });
  }

  public spawnRemoteTroop(team: Team, type: TroopType = 'basic') { this.createTroop(team, type); }

  public issueCommand(team: Team, command: 'charge' | 'retreat') {
    this.state.troops.filter(t => t.team === team).forEach(t => {
      t.state = command === 'charge' ? 'advancing' : 'retreating';
    });
  }

  private createTroop(team: Team, type: TroopType) {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    const newTroop: Troop = {
      id, type, x: team === 'player' ? castle.x + castle.width : castle.x, y: CANVAS_HEIGHT - 120,
      speed: team === 'player' ? stats.speed : -stats.speed, team, size: stats.size,
      health: stats.health, maxHealth: stats.health, secondaryHealth: stats.health,
      attackDamage: stats.attackDamage, attackRange: stats.attackRange, attackCooldown: stats.attackCooldown,
      lastAttackTime: 0, isAttacking: false, isTakingDamage: false, damageFlashTimer: 0,
      bobbingTimer: Math.random() * Math.PI * 2, kills: 0, rank: 0, state: 'idle',
      isFrozen: false, freezeTimer: 0, lastSpecialTime: Date.now()
    };
    this.state.troops.push(newTroop);
    this.state.stats[team].troopsSpawned++;
  }

  public update() {
    if (this.state.isPaused) return;
    const now = Date.now();
    
    if (now - this.state.lastManualScroll > 3000) this.state.isAutoCamera = true;
    if (this.state.isAutoCamera) {
        const playerTroops = this.state.troops.filter(t => t.team === 'player');
        const frontX = playerTroops.length > 0 ? Math.max(...playerTroops.map(t => t.x)) : 0;
        const targetCamX = Math.max(0, Math.min(CANVAS_WIDTH - 1600, frontX - 800));
        this.state.cameraX += (targetCamX - this.state.cameraX) * 0.1;
    }

    [this.state.playerCastle, this.state.opponentCastle, ...this.state.extraEnemyCastles].forEach(c => {
      if ('secondaryHealth' in c && c.secondaryHealth > c.health) c.secondaryHealth -= (c.secondaryHealth - c.health) * 0.1;
      if ('activeShield' in c && c.activeShield > 0) c.activeShield -= 16.67;
    });

    if (this.state.mode === 'castle_wars') {
        if (this.state.opponentCastle.health <= 0 && this.state.extraEnemyCastles.length > 0) {
            const next = this.state.extraEnemyCastles.shift()!;
            this.state.opponentCastle.x = next.x;
            this.state.opponentCastle.health = next.health;
            this.state.opponentCastle.maxHealth = next.maxHealth;
            this.state.opponentCastle.secondaryHealth = next.health;
            this.state.opponentGold += 500;
        }
    }

    this.visualEffects.forEach(e => e.life -= 0.02);
    this.visualEffects = this.visualEffects.filter(e => e.life > 0);

    this.state.troops.forEach(t => {
      if (t.secondaryHealth > t.health) t.secondaryHealth -= (t.secondaryHealth - t.health) * 0.1;
      if (t.isFrozen) { t.freezeTimer -= 16.67; if (t.freezeTimer <= 0) t.isFrozen = false; }
      
      // UNIQUE SPECIAL ATTACKS (Every 15s)
      if (now - t.lastSpecialTime >= 15000) {
          if (t.type === 'dragon') {
              this.visualEffects.push({ id: Math.random().toString(), type: 'fire_breath', x: t.x + (t.team === 'player' ? 100 : -100), y: t.y - 50, life: 1, maxLife: 1, color: '#FF453A' });
              this.state.troops.filter(other => other.team !== t.team && Math.abs(other.x - t.x) < 300).forEach(other => { other.health -= 300; });
          } else if (t.type === 'angel') {
              this.visualEffects.push({ id: Math.random().toString(), type: 'lightning', x: t.x + (t.team === 'player' ? 200 : -200), y: 0, life: 1, maxLife: 1, color: '#FFD60A', points: [{x: t.x, y: 0}, {x: t.x + 100, y: 300}, {x: t.x, y: CANVAS_HEIGHT}] });
              this.state.troops.filter(other => other.team !== t.team && Math.abs(other.x - t.x) < 400).forEach(other => { other.health -= 200; other.isFrozen = true; other.freezeTimer = 2000; });
          } else if (t.type === 'tank') {
              this.visualEffects.push({ id: Math.random().toString(), type: 'shockwave', x: t.x, y: CANVAS_HEIGHT - 100, life: 1, maxLife: 1, color: '#E2B759' });
              this.state.troops.filter(other => other.team !== t.team && Math.abs(other.x - t.x) < 250).forEach(other => { 
                  other.x += (t.team === 'player' ? 150 : -150); 
                  other.health -= 150; 
              });
          }
          t.lastSpecialTime = now;
      }
    });

    if (now - this.state.lastIncomeTime >= 1000) {
      this.state.gold += 20; this.state.opponentGold += 20;
      this.state.lastIncomeTime = now;
    }

    this.state.emotes.forEach(e => e.life -= 0.02);
    this.state.emotes = this.state.emotes.filter(e => e.life > 0);

    if (!this.state.isMultiplayer && this.state.status === 'playing' && now - this.state.lastAiDecisionTime >= 1500) {
        this.handleAiDecision(now);
    }

    if (this.state.screenShake > 0) { this.state.screenShake *= 0.85; if (this.state.screenShake < 0.1) this.state.screenShake = 0; }
    
    this.state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
    this.state.particles = this.state.particles.filter(p => p.life > 0);

    this.state.troops.forEach((troop) => {
      let isBlocked = false; 
      let target: Troop | Castle | null = null;
      troop.isAttacking = false;
      troop.bobbingTimer += 0.15;
      if (troop.damageFlashTimer > 0) troop.damageFlashTimer--; else troop.isTakingDamage = false;
      
      const enemyCastle = troop.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      const currentRange = troop.attackRange;
      let currentSpeed = troop.state === 'advancing' ? troop.speed : (troop.state === 'retreating' ? -troop.speed : 0);

      const distToCastle = Math.abs(troop.x - (troop.team === 'player' ? enemyCastle.x : enemyCastle.x + enemyCastle.width));
      if (distToCastle <= currentRange) { isBlocked = true; target = enemyCastle; }
      
      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;
        const dist = troop.team === 'player' ? other.x - troop.x : troop.x - other.x;
        if (troop.team !== other.team && dist > 0 && dist < currentRange) { isBlocked = true; target = other; }
      });

      if (!isBlocked && troop.state !== 'idle' && !troop.isFrozen) troop.x += currentSpeed;
      else if (target && !troop.isFrozen) {
        if (now - troop.lastAttackTime >= troop.attackCooldown) {
          if (troop.type.includes('archer') || troop.type === 'crossman') this.spawnProjectile(troop, target);
          else this.dealDamage(troop, target);
          troop.lastAttackTime = now; troop.isAttacking = true;
        }
      }
    });

    this.state.projectiles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25;
      this.state.troops.forEach(t => {
        if (t.team !== p.team && Math.abs(p.x - t.x) < 40 && Math.abs(p.y - (t.y - 40)) < 50) {
          this.dealDamage(p, t);
          if (p.type !== 'meteor') p.y = 9999;
        }
      });
      const eC = p.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      if (p.x >= eC.x && p.x <= eC.x + eC.width && p.y >= CANVAS_HEIGHT - eC.height - 100) { this.dealDamage(p, eC); p.y = 9999; }
    });
    this.state.projectiles = this.state.projectiles.filter(p => p.y < CANVAS_HEIGHT);

    this.state.troops.filter(t => t.health <= 0).forEach(t => this.spawnDeathParticles(t));
    this.state.troops = this.state.troops.filter(t => t.health > 0);

    if (this.state.opponentCastle.health <= 0) { 
        if (this.state.mode === 'castle_wars' && this.state.extraEnemyCastles.length > 0) {} 
        else { this.state.status = 'victory'; this.state.isPaused = true; }
    }
    else if (this.state.playerCastle.health <= 0) { this.state.status = 'defeat'; this.state.isPaused = true; }
  }

  private handleAiDecision(now: number) {
    const gold = this.state.opponentGold;
    if (gold >= 500) { this.createTroop('opponent', 'dragon'); this.state.opponentGold -= 500; }
    else if (gold >= 250) { this.createTroop('opponent', 'tank'); this.state.opponentGold -= 250; }
    else if (gold >= 75) { this.createTroop('opponent', 'berserker'); this.state.opponentGold -= 75; }
    else if (gold >= 20) { this.createTroop('opponent', 'basic'); this.state.opponentGold -= 20; }
    this.issueCommand('opponent', 'charge');
    this.state.lastAiDecisionTime = now;
  }

  private dealDamage(attacker: Troop | Projectile, defender: Troop | Castle) {
    if ('activeShield' in defender && defender.activeShield > 0) return;
    const damage = 'damage' in attacker ? attacker.damage : (attacker as Troop).attackDamage;
    defender.health -= damage;
    this.spawnImpactParticles(defender.x + 30, 'y' in defender ? defender.y : CANVAS_HEIGHT - 120, '#FF453A');
  }

  private spawnImpactParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 5; i++) {
      this.state.particles.push({
        id: Math.random().toString(), x, y,
        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 2, color, life: 0.8
      });
    }
  }

  private spawnDeathParticles(troop: Troop) {
    for (let i = 0; i < 8; i++) {
      this.state.particles.push({
        id: Math.random().toString(), x: troop.x, y: troop.y - 40,
        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.8) * 15, size: Math.random() * 8 + 2,
        color: '#FF0000', life: 1.0
      });
    }
  }

  private spawnProjectile(attacker: Troop, target: Troop | Castle) {
    const dx = target.x - attacker.x;
    const g = 0.25; const t = 60; const vx = dx / t;
    const vy = (60 - 0.5 * g * t * t) / t;
    this.state.projectiles.push({
      id: Math.random().toString(), x: attacker.x, y: attacker.y - 60, vx, vy,
      team: attacker.team, damage: attacker.attackDamage, type: 'arrow'
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.state.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.state.screenShake, (Math.random() - 0.5) * this.state.screenShake);
    if (this.assets.bg.complete) {
        const bgW = 2000;
        for (let i = 0; i < 4; i++) ctx.drawImage(this.assets.bg, (i * bgW) - this.state.cameraX * 0.5, 0, bgW, CANVAS_HEIGHT);
    }
    ctx.translate(-this.state.cameraX, 0);
    this.drawObjective(ctx);
    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);
    this.state.extraEnemyCastles.forEach(c => this.drawCastle(ctx, c as any));
    this.state.troops.forEach(t => this.drawTroop(ctx, t)); 
    this.state.projectiles.forEach(p => this.drawProjectile(ctx, p));
    this.visualEffects.forEach(e => this.drawVisualEffect(ctx, e));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));
    this.state.emotes.forEach(e => this.drawEmote(ctx, e));
    ctx.restore();
  }

  private drawVisualEffect(ctx: CanvasRenderingContext2D, e: VisualEffect) {
    ctx.save(); ctx.globalAlpha = e.life;
    if (e.type === 'lightning' && e.points) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.shadowBlur = 20; ctx.shadowColor = e.color;
        ctx.beginPath(); ctx.moveTo(e.points[0].x, e.points[0].y);
        e.points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
        ctx.strokeStyle = e.color; ctx.lineWidth = 8; ctx.stroke();
    } else if (e.type === 'moon') {
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 250);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, e.color); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(e.x, e.y, 250, 0, Math.PI*2); ctx.fill();
    } else if (e.type === 'ice') {
        ctx.fillStyle = e.color; ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
        for (let i = 0; i < 10; i++) {
            const ix = e.x + (i - 5) * 100;
            ctx.beginPath(); ctx.moveTo(ix, e.y); ctx.lineTo(ix + 30, e.y - 150); ctx.lineTo(ix + 60, e.y); ctx.fill();
        }
    } else if (e.type === 'shockwave') {
        ctx.strokeStyle = e.color; ctx.lineWidth = 10 * e.life;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 800 * (1-e.life), 200 * (1-e.life), 0, 0, Math.PI*2); ctx.stroke();
    } else if (e.type === 'fire_breath') {
        const grad = ctx.createLinearGradient(e.x, e.y, e.x + 300, e.y);
        grad.addColorStop(0, '#FF453A'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fillRect(e.x, e.y, 300, 100);
    }
    ctx.restore();
  }

  private drawObjective(ctx: CanvasRenderingContext2D) {
    const obj = this.state.objective; ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2); ctx.fill();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 80 - castle.height;
    if (this.assets.castle.complete) {
        ctx.save();
        if (castle.team === 'opponent' || !castle.team) { ctx.translate(castle.x + castle.width, 0); ctx.scale(-1, 1); ctx.drawImage(this.assets.castle, 0, y, castle.width, castle.height); }
        else ctx.drawImage(this.assets.castle, castle.x, y, castle.width, castle.height);
        ctx.restore();
    }
    const bW = castle.width; const hpP = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(castle.x, y - 40, bW, 10);
    ctx.fillStyle = (!castle.team || castle.team === 'opponent') ? '#FF453A' : '#32D74B'; ctx.fillRect(castle.x, y - 40, bW * hpP, 10);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const stats = TROOP_STATS[troop.type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
    const img = this.assets[stats.asset];
    const bob = Math.sin(troop.bobbingTimer) * 4;
    ctx.save(); ctx.translate(troop.x, troop.y - troop.size + bob);
    if (img && img.complete) {
        if (troop.team === 'opponent') { ctx.translate(troop.size, 0); ctx.scale(-1, 1); }
        if (troop.isTakingDamage) ctx.filter = 'brightness(2) saturate(2)';
        if (troop.isFrozen) ctx.filter = 'hue-rotate(180deg) brightness(1.5) drop-shadow(0 0 10px #64D2FF)';
        ctx.drawImage(img, 0, 0, troop.size, troop.size);
    }
    ctx.restore();
    const bW = troop.size; const hpP = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(troop.x, troop.y - troop.size - 20, bW, 4);
    ctx.fillStyle = troop.team === 'player' ? '#32D74B' : '#FF453A'; ctx.fillRect(troop.x, troop.y - troop.size - 20, bW * hpP, 4);
  }

  private drawEmote(ctx: CanvasRenderingContext2D, e: Emote) {
    ctx.save(); ctx.globalAlpha = e.life; ctx.fillStyle = '#fff'; ctx.font = '40px Inter'; ctx.textAlign = 'center';
    ctx.fillText(e.type, e.x, e.y - (1 - e.life) * 50); ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
    if (p.type === 'meteor') {
        const grad = ctx.createLinearGradient(-40, 0, 0, 0);
        grad.addColorStop(0, 'transparent'); grad.addColorStop(1, '#FF453A');
        ctx.fillStyle = grad; ctx.fillRect(-60, -10, 60, 20);
        ctx.fillStyle = '#FFD60A'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, 0); ctx.stroke();
    }
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
  }
}
