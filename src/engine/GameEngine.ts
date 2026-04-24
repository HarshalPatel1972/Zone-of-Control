import { GameState, Troop, Castle, Team } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

export class GameEngine {
  private state: GameState;
  private onStateChange?: (state: GameState) => void;

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
      isPaused: false,
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public spawnTroop(team: Team) {
    const id = Math.random().toString(36).substr(2, 9);
    const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
    
    const newTroop: Troop = {
      id,
      x: team === 'player' ? castle.x + castle.width : castle.x,
      y: CANVAS_HEIGHT - 100, // Ground level
      speed: team === 'player' ? 2 : -2,
      team,
      size: 40,
      color: team === 'player' ? '#000000' : '#FF0000',
    };

    this.state.troops.push(newTroop);
  }

  public update() {
    if (this.state.isPaused) return;

    // Update troops
    this.state.troops.forEach((troop) => {
      troop.x += troop.speed;
    });

    // Simple bounds check (cleanup)
    this.state.troops = this.state.troops.filter(
      (troop) => troop.x > -100 && troop.x < CANVAS_WIDTH + 100
    );
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
    ctx.fillStyle = castle.team === 'player' ? '#FFF' : '#222';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    
    const y = CANVAS_HEIGHT - 60 - castle.height;
    
    // Main block
    ctx.fillRect(castle.x, y, castle.width, castle.height);
    ctx.strokeRect(castle.x, y, castle.width, castle.height);

    // Health bar
    const barWidth = castle.width;
    const barHeight = 20;
    const barX = castle.x;
    const barY = y - 40;

    ctx.fillStyle = '#EEE';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = castle.team === 'player' ? '#000' : '#555';
    const healthPercent = castle.health / castle.maxHealth;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    ctx.fillStyle = troop.team === 'player' ? '#000' : '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;

    const drawY = troop.y - troop.size;
    
    ctx.fillRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);
    ctx.strokeRect(troop.x - troop.size / 2, drawY, troop.size, troop.size);
  }
}
