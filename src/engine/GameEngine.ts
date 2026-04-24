import { GameState, Troop, Castle, Team, Particle, TroopType } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

export const TROOP_STATS = {
  BASIC: {
    cost: 25,
    health: 120,
    attackDamage: 15,
    attackRange: 50,
    attackCooldown: 800,
    speed: 3,
    size: 45,
    color: '#CCFF00', // Acid Green
  },
  ARCHER: {
    cost: 40,
    health: 80,
    attackDamage: 20,
    attackRange: 400,
    attackCooldown: 1200,
    speed: 2.5,
    size: 40,
    color: '#00F0FF', // Cyan
  },
  BERSERKER: {
    cost: 60,
    health: 250,
    attackDamage: 30,
    attackRange: 60,
    attackCooldown: 600,
    speed: 4,
    size: 55,
    color: '#FF3E00', // Orange
  }
};

export const CASTLE_UPGRADES = {
  2: { cost: 200, healthBoost: 500, incomeBoost: 5 },
  3: { cost: 500, healthBoost: 1000, incomeBoost: 10 },
};

export class GameEngine {
  private state: GameState;
  private audioEnabled: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    return {
      playerCastle: {
        health: 1000,
        maxHealth: 1000,
        x: 50,
        width: 180,
        height: 350,
        team: 'player',
        level: 1,
      },
      opponentCastle: {
        health: 1000,
        maxHealth: 1000,
        x: CANVAS_WIDTH - 230,
        width: 180,
        height: 350,
        team: 'opponent',
        level: 1,
      },
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

  public setMultiplayer(enabled: boolean) {
    this.state.isMultiplayer = enabled;
  }

  public getState(): GameState {
    return { ...this.state };
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
    
    this.playSound('spawn');
  }

  public spawnTroop(team: Team, type: TroopType = 'basic') {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
    if (team === 'player' && this.state.gold < stats.cost) return;

    if (team === 'player') {
      this.state.gold -= stats.cost;
      this.playSound('spawn');
    }

    this.createTroop(team, type);
  }

  public spawnRemoteTroop(team: Team, type: TroopType = 'basic') {
    this.createTroop(team, type);
  }

  private createTroop(team: Team, type: TroopType) {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    
    const newTroop: Troop = {
      id,
      type,
      x: team === 'player' ? castle.x + castle.width : castle.x,
      y: CANVAS_HEIGHT - 60,
      speed: team === 'player' ? stats.speed : -stats.speed,
      team,
      size: stats.size,
      color: stats.color,
      health: stats.health,
      maxHealth: stats.health,
      attackDamage: stats.attackDamage,
      attackRange: stats.attackRange,
      attackCooldown: stats.attackCooldown,
      lastAttackTime: 0,
      isAttacking: false,
      isTakingDamage: false,
      damageFlashTimer: 0,
    };

    this.state.troops.push(newTroop);
  }

  public update() {
    if (this.state.isPaused) return;

    const now = Date.now();

    // 1. Update Economy
    if (now - this.state.lastIncomeTime >= 1000) {
      const pLevel = this.state.playerCastle.level as 2 | 3;
      const oLevel = this.state.opponentCastle.level as 2 | 3;
      this.state.gold += 15 + (CASTLE_UPGRADES[pLevel]?.incomeBoost || 0);
      this.state.opponentGold += 15 + (CASTLE_UPGRADES[oLevel]?.incomeBoost || 0);
      this.state.lastIncomeTime = now;
    }

    // 2. Opponent AI
    if (!this.state.isMultiplayer && this.state.status === 'playing' && now - this.state.lastAiDecisionTime >= 1500) {
      const decision = Math.random();
      if (decision < 0.1 && this.state.opponentCastle.level < 3) {
        this.upgradeCastle('opponent');
      } else if (decision < 0.5) {
        const types: TroopType[] = ['basic', 'archer', 'berserker'];
        const type = types[Math.floor(Math.random() * types.length)];
        const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS];
        if (this.state.opponentGold >= stats.cost) {
          this.state.opponentGold -= stats.cost;
          this.createTroop('opponent', type);
        }
      }
      this.state.lastAiDecisionTime = now;
    }

    // 3. Screen Shake
    if (this.state.screenShake > 0) {
      this.state.screenShake *= 0.85;
      if (this.state.screenShake < 0.1) this.state.screenShake = 0;
    }

    // 4. Particles
    this.state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    });
    this.state.particles = this.state.particles.filter(p => p.life > 0);

    // 5. Update Troops
    this.state.troops.forEach((troop) => {
      let isBlocked = false;
      let target: Troop | Castle | null = null;

      troop.isAttacking = false;
      if (troop.damageFlashTimer > 0) troop.damageFlashTimer--;
      else troop.isTakingDamage = false;

      const enemyCastle = troop.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      const distToCastle = Math.abs(troop.x - (troop.team === 'player' ? enemyCastle.x : enemyCastle.x + enemyCastle.width));

      if (distToCastle <= troop.attackRange) {
        isBlocked = true;
        target = enemyCastle;
      }

      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;
        const dist = troop.team === 'player' ? other.x - troop.x : troop.x - other.x;
        if (troop.team === other.team) {
          if (dist > 0 && dist < troop.size + 10) isBlocked = true;
        } else {
          if (dist > 0 && dist < troop.attackRange) {
            isBlocked = true;
            target = other;
          }
        }
      });

      if (!isBlocked) {
        troop.x += troop.speed;
      } else if (target) {
        if (now - troop.lastAttackTime >= troop.attackCooldown) {
          this.dealDamage(troop, target);
          troop.lastAttackTime = now;
          troop.isAttacking = true;
          this.playSound('clash');
        }
      }
    });

    // 6. Cleanup dead troops
    const deadTroops = this.state.troops.filter(t => t.health <= 0);
    deadTroops.forEach(t => this.spawnDeathParticles(t));
    this.state.troops = this.state.troops.filter(t => t.health > 0);

    // 7. Bounds
    this.state.troops = this.state.troops.filter(t => t.x > -200 && t.x < CANVAS_WIDTH + 200);

    // 8. Win/Loss
    if (this.state.opponentCastle.health <= 0) {
      this.state.status = 'victory';
      this.state.isPaused = true;
      this.playSound('game_over');
    } else if (this.state.playerCastle.health <= 0) {
      this.state.status = 'defeat';
      this.state.isPaused = true;
      this.playSound('game_over');
    }
  }

  private dealDamage(attacker: Troop, defender: Troop | Castle) {
    defender.health -= attacker.attackDamage;
    if ('isTakingDamage' in defender) {
      (defender as Troop).isTakingDamage = true;
      (defender as Troop).damageFlashTimer = 5;
    } else {
      this.state.screenShake = 20;
    }
  }

  private spawnDeathParticles(troop: Troop) {
    for (let i = 0; i < 8; i++) {
      this.state.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: troop.x,
        y: troop.y - troop.size / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.8) * 15,
        size: Math.random() * 12 + 4,
        color: troop.color,
        life: 1.0
      });
    }
  }

  private playSound(type: 'spawn' | 'clash' | 'game_over') {
    if (!this.audioEnabled) return;
    console.log(`[AUDIO] ${type}`);
  }

  public enableAudio() { this.audioEnabled = true; }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.state.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.state.screenShake, (Math.random() - 0.5) * this.state.screenShake);
    }

    ctx.clearRect(-200, -200, CANVAS_WIDTH + 400, CANVAS_HEIGHT + 400);

    // Grid
    ctx.strokeStyle = 'rgba(204, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
    for (let y = 0; y < CANVAS_HEIGHT; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

    // Ground
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT - 60); ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 60); ctx.stroke();

    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);

    this.state.troops.forEach(t => this.drawTroop(ctx, t));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));

    ctx.restore();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 60 - castle.height;
    
    // Castle Body
    ctx.fillStyle = castle.team === 'player' ? '#111' : '#050505';
    ctx.strokeStyle = castle.team === 'player' ? '#CCFF00' : '#FF3E00';
    ctx.lineWidth = 6;
    
    // Draw fancy castle shape
    ctx.beginPath();
    ctx.moveTo(castle.x, y + castle.height);
    ctx.lineTo(castle.x, y + 100);
    ctx.lineTo(castle.x + 40, y + 100);
    ctx.lineTo(castle.x + 40, y);
    ctx.lineTo(castle.x + castle.width - 40, y);
    ctx.lineTo(castle.x + castle.width - 40, y + 100);
    ctx.lineTo(castle.x + castle.width, y + 100);
    ctx.lineTo(castle.x + castle.width, y + castle.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Health Bar
    const barWidth = castle.width * 1.5;
    const barHeight = 24;
    const barX = castle.x - (barWidth - castle.width) / 2;
    const barY = y - 60;
    ctx.fillStyle = '#000'; ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpPerc = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillStyle = castle.team === 'player' ? '#CCFF00' : '#FF3E00';
    ctx.fillRect(barX + 4, barY + 4, (barWidth - 8) * hpPerc, barHeight - 8);
    
    // Level Badge
    ctx.fillStyle = '#FFF';
    ctx.font = '900 14px "Outfit"';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${castle.level}`, castle.x + castle.width / 2, y + 50);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    ctx.save();
    ctx.translate(troop.x, troop.y - 60);
    
    // Flip based on team
    if (troop.team === 'opponent') ctx.scale(-1, 1);

    if (troop.isTakingDamage) ctx.fillStyle = '#FFF';
    else if (troop.isAttacking) ctx.fillStyle = '#FFF';
    else ctx.fillStyle = troop.color;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    // Draw unique silhouettes based on type
    if (troop.type === 'basic') {
        // Shield & Sword Knight
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-15, -40); ctx.lineTo(15, -40); ctx.lineTo(15, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Shield
        ctx.fillStyle = '#FFF';
        ctx.fillRect(10, -35, 10, 25);
    } else if (troop.type === 'archer') {
        // Slender Archer
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(-5, -45); ctx.lineTo(5, -45); ctx.lineTo(10, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Bow
        ctx.strokeStyle = '#FFF';
        ctx.beginPath(); ctx.arc(10, -25, 15, -Math.PI/2, Math.PI/2); ctx.stroke();
    } else if (troop.type === 'berserker') {
        // Massive Berserker
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-20, -55); ctx.lineTo(20, -55); ctx.lineTo(25, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Axe
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-20, -65, 40, 10);
    }

    ctx.restore();

    // Health line
    const hpPerc = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = '#000'; ctx.fillRect(troop.x - troop.size/2, troop.y - troop.size - 20, troop.size, 5);
    ctx.fillStyle = troop.color; ctx.fillRect(troop.x - troop.size/2, troop.y - troop.size - 20, troop.size * hpPerc, 5);
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    ctx.globalAlpha = 1;
  }
}
