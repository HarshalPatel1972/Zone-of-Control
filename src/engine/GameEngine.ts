import { GameState, Troop, Castle, Team } from './types';

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

  constructor() {
    this.state = {
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
      gold: 100,
      opponentGold: 100,
      lastIncomeTime: Date.now(),
      lastAiDecisionTime: Date.now(),
      status: 'playing',
      isPaused: false,
      isMultiplayer: false,
    };
  }

  public setMultiplayer(enabled: boolean) {
    this.state.isMultiplayer = enabled;
  }

  public reset() {
    this.state = {
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
      gold: 100,
      opponentGold: 100,
      lastIncomeTime: Date.now(),
      lastAiDecisionTime: Date.now(),
      status: 'playing',
      isPaused: false,
      isMultiplayer: this.state.isMultiplayer,
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public spawnTroop(team: Team) {
    if (team === 'player' && this.state.gold < TROOP_STATS.BASIC.cost) return;

    if (team === 'player') {
      this.state.gold -= TROOP_STATS.BASIC.cost;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    
    const newTroop: Troop = {
      id,
      x: team === 'player' ? castle.x + castle.width : castle.x,
      y: CANVAS_HEIGHT - 60, // Ground level
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

  public spawnRemoteTroop(team: Team) {
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    
    const newTroop: Troop = {
      id,
      x: team === 'player' ? castle.x + castle.width : castle.x,
      y: CANVAS_HEIGHT - 60, // Ground level
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

    // 1. Update Economy (10 gold per second)
    if (now - this.state.lastIncomeTime >= 1000) {
      this.state.gold += 10;
      this.state.opponentGold += 10;
      this.state.lastIncomeTime = now;
    }

    // 2. Opponent AI Logic (Disabled in Multiplayer)
    if (!this.state.isMultiplayer && this.state.status === 'playing' && now - this.state.lastAiDecisionTime >= 1000) {
      if (this.state.opponentGold >= TROOP_STATS.BASIC.cost) {
        // AI decides to spawn (random chance for human-like pacing)
        if (Math.random() < 0.4) {
          this.state.opponentGold -= TROOP_STATS.BASIC.cost;
          this.spawnTroop('opponent');
        }
      }
      this.state.lastAiDecisionTime = now;
    }

    // 2. Update Troops
    this.state.troops.forEach((troop) => {
      let isBlocked = false;
      let target: Troop | Castle | null = null;

      // Reset states
      troop.isAttacking = false;
      if (troop.damageFlashTimer > 0) troop.damageFlashTimer--;
      else troop.isTakingDamage = false;

      // Check collision with enemy castle
      const enemyCastle = troop.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      const distToCastle = troop.team === 'player' 
        ? enemyCastle.x - troop.x 
        : troop.x - (enemyCastle.x + enemyCastle.width);

      if (distToCastle <= troop.attackRange) {
        isBlocked = true;
        target = enemyCastle;
      }

      // Check collision with other troops (1D)
      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;

        const dist = troop.team === 'player' 
          ? other.x - troop.x 
          : troop.x - other.x;

        // Friendly collision (stacking prevention)
        if (troop.team === other.team) {
          if (dist > 0 && dist < troop.size + 10) {
            isBlocked = true;
          }
        } 
        // Enemy collision
        else {
          if (dist > 0 && dist < troop.attackRange) {
            isBlocked = true;
            target = other;
          }
        }
      });

      // Movement or Combat
      if (!isBlocked) {
        troop.x += troop.speed;
      } else if (target) {
        // Combat logic
        if (now - troop.lastAttackTime >= troop.attackCooldown) {
          this.dealDamage(troop, target);
          troop.lastAttackTime = now;
          troop.isAttacking = true;
        }
      }
    });

    // 3. Remove dead troops
    this.state.troops = this.state.troops.filter((t) => t.health > 0);

    // 4. Bounds check (cleanup)
    this.state.troops = this.state.troops.filter(
      (troop) => troop.x > -100 && troop.x < CANVAS_WIDTH + 100
    );

    // 5. Win/Loss Conditions
    if (this.state.opponentCastle.health <= 0) {
      this.state.status = 'victory';
      this.state.isPaused = true;
    } else if (this.state.playerCastle.health <= 0) {
      this.state.status = 'defeat';
      this.state.isPaused = true;
    }
  }

  private dealDamage(attacker: Troop, defender: Troop | Castle) {
    defender.health -= attacker.attackDamage;
    if ('isTakingDamage' in defender) {
      (defender as Troop).isTakingDamage = true;
      (defender as Troop).damageFlashTimer = 5;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background (simple ground line)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 60);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 60);
    ctx.stroke();

    // Draw Castles (Neo-Brutalist: sharp, thick borders)
    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);

    // Draw Troops
    this.state.troops.forEach((troop) => {
      this.drawTroop(ctx, troop);
    });
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 60 - castle.height;
    
    // Castle Body
    ctx.fillStyle = castle.team === 'player' ? '#FFF' : '#222';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.fillRect(castle.x, y, castle.width, castle.height);
    ctx.strokeRect(castle.x, y, castle.width, castle.height);

    // Large Stylized Health Bar
    const barWidth = castle.width * 1.5;
    const barHeight = 30;
    const barX = castle.x - (barWidth - castle.width) / 2;
    const barY = y - 60;

    // Bar Background
    ctx.fillStyle = '#FFF';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Health Fill
    ctx.fillStyle = castle.team === 'player' ? '#000' : '#555';
    const healthPercent = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Health Text
    ctx.fillStyle = castle.team === 'player' ? '#FFF' : '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(castle.health)}HP`, barX + barWidth / 2, barY + 20);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const drawY = troop.y - troop.size;
    
    // Damage Flash / Normal Color
    if (troop.isTakingDamage) {
      ctx.fillStyle = '#F00'; // Stark Red on damage
    } else if (troop.isAttacking) {
      ctx.fillStyle = '#FFF'; // Stark White on attack
    } else {
      ctx.fillStyle = troop.team === 'player' ? '#000' : '#555';
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.fillRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);
    ctx.strokeRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);

    // Troop Health Bar
    const barWidth = troop.size * 1.2;
    const barHeight = 8;
    const barX = troop.x - barWidth / 2;
    const barY = drawY - 15;

    ctx.fillStyle = '#FFF';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = troop.team === 'player' ? '#000' : '#555';
    const healthPercent = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }
}
