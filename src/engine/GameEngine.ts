import { GameState, Troop, Castle, Team, Particle, TroopType } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

export const TROOP_STATS = {
  BASIC: { cost: 25, health: 120, attackDamage: 15, attackRange: 50, attackCooldown: 800, speed: 3, size: 80, asset: 'knight' },
  ARCHER: { cost: 40, health: 80, attackDamage: 20, attackRange: 400, attackCooldown: 1200, speed: 2.5, size: 80, asset: 'archer' },
  BERSERKER: { cost: 60, health: 250, attackDamage: 30, attackRange: 60, attackCooldown: 600, speed: 4, size: 100, asset: 'berserker' }
};

export const CASTLE_UPGRADES = {
  2: { cost: 200, healthBoost: 500, incomeBoost: 5 },
  3: { cost: 500, healthBoost: 1000, incomeBoost: 10 },
};

export class GameEngine {
  private state: GameState;
  private audioEnabled: boolean = false;
  private assets: Record<string, HTMLImageElement> = {};
  private assetsLoaded: boolean = false;

  constructor() {
    this.state = this.getInitialState();
    this.loadAssets();
  }

  private loadAssets() {
    const assetNames = ['bg', 'knight', 'archer', 'berserker', 'castle'];
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
    return {
      playerCastle: { health: 1000, maxHealth: 1000, x: 100, width: 250, height: 400, team: 'player', level: 1 },
      opponentCastle: { health: 1000, maxHealth: 1000, x: CANVAS_WIDTH - 350, width: 250, height: 400, team: 'opponent', level: 1 },
      troops: [],
      particles: [],
      gold: 150,
      opponentGold: 150,
      lastIncomeTime: Date.now(),
      lastAiDecisionTime: Date.now(),
      status: 'playing',
      isPaused: false,
      isMultiplayer: false,
      screenShake: 0,
    };
  }

  public reset() {
    const isMulti = this.state.isMultiplayer;
    this.state = this.getInitialState();
    this.state.isMultiplayer = isMulti;
  }

  public setMultiplayer(enabled: boolean) { this.state.isMultiplayer = enabled; }
  public getState(): GameState { return { ...this.state }; }

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
    this.playSound('spawn');
  }

  public spawnTroop(team: Team, type: TroopType = 'basic') {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
    if (team === 'player' && this.state.gold < stats.cost) return;
    if (team === 'player') { this.state.gold -= stats.cost; this.playSound('spawn'); }
    this.createTroop(team, type);
  }

  public spawnRemoteTroop(team: Team, type: TroopType = 'basic') { this.createTroop(team, type); }

  private createTroop(team: Team, type: TroopType) {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    const newTroop: Troop = {
      id, type, x: team === 'player' ? castle.x + castle.width : castle.x, y: CANVAS_HEIGHT - 120,
      speed: team === 'player' ? stats.speed : -stats.speed, team, size: stats.size,
      color: '', health: stats.health, maxHealth: stats.health, attackDamage: stats.attackDamage,
      attackRange: stats.attackRange, attackCooldown: stats.attackCooldown,
      lastAttackTime: 0, isAttacking: false, isTakingDamage: false, damageFlashTimer: 0,
    };
    this.state.troops.push(newTroop);
  }

  public update() {
    if (this.state.isPaused) return;
    const now = Date.now();
    if (now - this.state.lastIncomeTime >= 1000) {
      const pL = this.state.playerCastle.level as 2 | 3;
      const oL = this.state.opponentCastle.level as 2 | 3;
      this.state.gold += 15 + (CASTLE_UPGRADES[pL]?.incomeBoost || 0);
      this.state.opponentGold += 15 + (CASTLE_UPGRADES[oL]?.incomeBoost || 0);
      this.state.lastIncomeTime = now;
    }
    if (!this.state.isMultiplayer && this.state.status === 'playing' && now - this.state.lastAiDecisionTime >= 1500) {
      const decision = Math.random();
      if (decision < 0.1 && this.state.opponentCastle.level < 3) this.upgradeCastle('opponent');
      else if (decision < 0.5) {
        const types: TroopType[] = ['basic', 'archer', 'berserker'];
        const type = types[Math.floor(Math.random() * types.length)];
        const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
        if (this.state.opponentGold >= stats.cost) { this.state.opponentGold -= stats.cost; this.createTroop('opponent', type); }
      }
      this.state.lastAiDecisionTime = now;
    }
    if (this.state.screenShake > 0) { this.state.screenShake *= 0.85; if (this.state.screenShake < 0.1) this.state.screenShake = 0; }
    this.state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
    this.state.particles = this.state.particles.filter(p => p.life > 0);
    this.state.troops.forEach((troop) => {
      let isBlocked = false; let target: Troop | Castle | null = null;
      troop.isAttacking = false;
      if (troop.damageFlashTimer > 0) troop.damageFlashTimer--; else troop.isTakingDamage = false;
      const enemyCastle = troop.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      const distToCastle = Math.abs(troop.x - (troop.team === 'player' ? enemyCastle.x : enemyCastle.x + enemyCastle.width));
      if (distToCastle <= troop.attackRange) { isBlocked = true; target = enemyCastle; }
      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;
        const dist = troop.team === 'player' ? other.x - troop.x : troop.x - other.x;
        if (troop.team === other.team) { if (dist > 0 && dist < 40) isBlocked = true; }
        else { if (dist > 0 && dist < troop.attackRange) { isBlocked = true; target = other; } }
      });
      if (!isBlocked) troop.x += troop.speed;
      else if (target) {
        if (now - troop.lastAttackTime >= troop.attackCooldown) {
          this.dealDamage(troop, target); troop.lastAttackTime = now; troop.isAttacking = true; this.playSound('clash');
        }
      }
    });
    const deadTroops = this.state.troops.filter(t => t.health <= 0);
    deadTroops.forEach(t => this.spawnDeathParticles(t));
    this.state.troops = this.state.troops.filter(t => t.health > 0);
    if (this.state.opponentCastle.health <= 0) { this.state.status = 'victory'; this.state.isPaused = true; this.playSound('game_over'); }
    else if (this.state.playerCastle.health <= 0) { this.state.status = 'defeat'; this.state.isPaused = true; this.playSound('game_over'); }
  }

  private dealDamage(attacker: Troop, defender: Troop | Castle) {
    defender.health -= attacker.attackDamage;
    if ('isTakingDamage' in defender) { (defender as Troop).isTakingDamage = true; (defender as Troop).damageFlashTimer = 5; }
    else { this.state.screenShake = 20; }
  }

  private spawnDeathParticles(troop: Troop) {
    for (let i = 0; i < 8; i++) {
      this.state.particles.push({
        id: Math.random().toString(36).substr(2, 9), x: troop.x, y: troop.y - 40,
        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.8) * 15, size: Math.random() * 8 + 2,
        color: '#FF0000', life: 1.0
      });
    }
  }

  private playSound(type: 'spawn' | 'clash' | 'game_over') { if (this.audioEnabled) console.log(`[AUDIO] ${type}`); }
  public enableAudio() { this.audioEnabled = true; }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.state.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.state.screenShake, (Math.random() - 0.5) * this.state.screenShake);
    
    // Draw Background
    if (this.assets.bg.complete) {
      ctx.drawImage(this.assets.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);
    this.state.troops.forEach(t => this.drawTroop(ctx, t));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));
    ctx.restore();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 80 - castle.height;
    if (this.assets.castle.complete) {
        ctx.save();
        if (castle.team === 'opponent') {
            ctx.translate(castle.x + castle.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(this.assets.castle, 0, y, castle.width, castle.height);
        } else {
            ctx.drawImage(this.assets.castle, castle.x, y, castle.width, castle.height);
        }
        ctx.restore();
    }
    // Health Bar
    const bW = castle.width; const bH = 15; const bX = castle.x; const bY = y - 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bX, bY, bW, bH);
    const hpP = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillStyle = castle.team === 'player' ? '#00FF00' : '#FF0000';
    ctx.fillRect(bX, bY, bW * hpP, bH);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const img = this.assets[troop.type === 'basic' ? 'knight' : troop.type];
    if (img && img.complete) {
        ctx.save();
        ctx.translate(troop.x, troop.y - troop.size);
        if (troop.team === 'opponent') { ctx.translate(troop.size, 0); ctx.scale(-1, 1); }
        if (troop.isTakingDamage) ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
        ctx.drawImage(img, 0, 0, troop.size, troop.size);
        ctx.restore();
    }
    // Health Line
    const hpP = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(troop.x, troop.y - troop.size - 10, troop.size, 5);
    ctx.fillStyle = troop.team === 'player' ? '#00FF00' : '#FF0000';
    ctx.fillRect(troop.x, troop.y - troop.size - 10, troop.size * hpP, 5);
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
  }
}
