import { GameState, Troop, Castle, Team, Particle } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

export const TROOP_STATS = {
  BASIC: {
    cost: 25,
    health: 100,
    attackDamage: 10,
    attackRange: 50,
    attackCooldown: 1000,
    speed: 2.5,
    size: 40,
  }
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
        width: 150,
        height: 300,
        team: 'player',
      },
      opponentCastle: {
        health: 1000,
        maxHealth: 1000,
        x: CANVAS_WIDTH - 200,
        width: 150,
        height: 300,
        team: 'opponent',
      },
      troops: [],
      particles: [],
      gold: 100,
      opponentGold: 100,
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

  public spawnTroop(team: Team) {
    if (team === 'player' && this.state.gold < TROOP_STATS.BASIC.cost) return;

    if (team === 'player') {
      this.state.gold -= TROOP_STATS.BASIC.cost;
      this.playSound('spawn');
    }

    this.createTroop(team);
  }

  public spawnRemoteTroop(team: Team) {
    this.createTroop(team);
  }

  private createTroop(team: Team) {
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    
    const newTroop: Troop = {
      id,
      x: team === 'player' ? castle.x + castle.width : castle.x,
      y: CANVAS_HEIGHT - 60,
      speed: team === 'player' ? TROOP_STATS.BASIC.speed : -TROOP_STATS.BASIC.speed,
      team,
      size: TROOP_STATS.BASIC.size,
      color: team === 'player' ? '#000' : '#FFF',
      health: TROOP_STATS.BASIC.health,
      maxHealth: TROOP_STATS.BASIC.health,
      attackDamage: TROOP_STATS.BASIC.attackDamage,
      attackRange: TROOP_STATS.BASIC.attackRange,
      attackCooldown: TROOP_STATS.BASIC.attackCooldown,
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
      this.state.gold += 10;
      this.state.opponentGold += 10;
      this.state.lastIncomeTime = now;
    }

    // 2. Opponent AI
    if (!this.state.isMultiplayer && this.state.status === 'playing' && now - this.state.lastAiDecisionTime >= 1000) {
      if (this.state.opponentGold >= TROOP_STATS.BASIC.cost) {
        if (Math.random() < 0.4) {
          this.state.opponentGold -= TROOP_STATS.BASIC.cost;
          this.createTroop('opponent');
        }
      }
      this.state.lastAiDecisionTime = now;
    }

    // 3. Update Screen Shake
    if (this.state.screenShake > 0) {
      this.state.screenShake *= 0.9;
      if (this.state.screenShake < 0.1) this.state.screenShake = 0;
    }

    // 4. Update Particles
    this.state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
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
      const distToCastle = troop.team === 'player' 
        ? enemyCastle.x - troop.x 
        : troop.x - (enemyCastle.x + enemyCastle.width);

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

    // 6. Cleanup dead troops & Spawn particles
    const deadTroops = this.state.troops.filter(t => t.health <= 0);
    deadTroops.forEach(t => this.spawnDeathParticles(t));
    this.state.troops = this.state.troops.filter(t => t.health > 0);

    // 7. Bounds check
    this.state.troops = this.state.troops.filter(t => t.x > -100 && t.x < CANVAS_WIDTH + 100);

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
      // It's a castle
      this.state.screenShake = 15;
    }
  }

  private spawnDeathParticles(troop: Troop) {
    for (let i = 0; i < 5; i++) {
      this.state.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: troop.x,
        y: troop.y - troop.size / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.8) * 10,
        size: Math.random() * 10 + 5,
        color: troop.color,
        life: 1.0
      });
    }
  }

  private playSound(type: 'spawn' | 'clash' | 'game_over') {
    if (!this.audioEnabled) return;
    console.log(`[AUDIO] Playing sound: ${type}`);
    // Structural logic for dropping in .wav files later
  }

  public enableAudio() {
    this.audioEnabled = true;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Apply Screen Shake
    if (this.state.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.state.screenShake;
      const dy = (Math.random() - 0.5) * this.state.screenShake;
      ctx.translate(dx, dy);
    }

    ctx.clearRect(-100, -100, CANVAS_WIDTH + 200, CANVAS_HEIGHT + 200);

    // Draw Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw Ground
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 60);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 60);
    ctx.stroke();

    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);

    this.state.troops.forEach(t => this.drawTroop(ctx, t));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));

    ctx.restore();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 60 - castle.height;
    
    // Castle Body - Brutalist Concrete Look
    ctx.fillStyle = castle.team === 'player' ? '#222' : '#111';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.fillRect(castle.x, y, castle.width, castle.height);
    ctx.strokeRect(castle.x, y, castle.width, castle.height);

    // Dynamic Health Bar
    const barWidth = castle.width * 1.5;
    const barHeight = 24;
    const barX = castle.x - (barWidth - castle.width) / 2;
    const barY = y - 50;

    ctx.fillStyle = '#000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    const healthPercent = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillStyle = castle.team === 'player' ? '#CCFF00' : '#FF3E00';
    ctx.fillRect(barX + 4, barY + 4, (barWidth - 8) * healthPercent, barHeight - 8);

    // Castle Team Indicator
    ctx.fillStyle = '#FFF';
    ctx.font = '900 12px "Outfit"';
    ctx.textAlign = 'center';
    ctx.fillText(castle.team.toUpperCase(), castle.x + castle.width / 2, y + 30);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const drawY = troop.y - troop.size;
    
    // Color states
    if (troop.isTakingDamage) ctx.fillStyle = '#FF0000';
    else if (troop.isAttacking) ctx.fillStyle = '#FFFFFF';
    else ctx.fillStyle = troop.team === 'player' ? '#CCFF00' : '#FF3E00';

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.fillRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);
    ctx.strokeRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);

    // Health Line (Minimalist)
    const healthPercent = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = '#000';
    ctx.fillRect(troop.x - troop.size / 2, drawY - 10, troop.size, 4);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(troop.x - troop.size / 2, drawY - 10, troop.size * healthPercent, 4);
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1.0;
  }
}
