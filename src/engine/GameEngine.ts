import { GameState, Troop, Castle, Team, Particle, TroopType, CpuDifficulty, Projectile, AbilityType, WeatherType, Emote, MatchStats } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

export const TROOP_STATS = {
  BASIC: { cost: 20, health: 150, attackDamage: 12, attackRange: 50, attackCooldown: 800, speed: 2.8, size: 80, asset: 'knight' },
  ARCHER: { cost: 45, health: 100, attackDamage: 25, attackRange: 450, attackCooldown: 1500, speed: 2.2, size: 80, asset: 'archer' },
  BERSERKER: { cost: 75, health: 400, attackDamage: 40, attackRange: 60, attackCooldown: 700, speed: 3.5, size: 100, asset: 'berserker' }
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
    const abilityInit = {
      meteor: { cooldown: 15000, lastUsed: 0 },
      heal: { cooldown: 20000, lastUsed: 0 },
      shield: { cooldown: 25000, lastUsed: 0 }
    };
    const statInit = { goldEarned: 150, troopsSpawned: 0, kills: 0, damageDealt: 0 };

    return {
      playerCastle: { health: 1200, maxHealth: 1200, secondaryHealth: 1200, x: 100, width: 250, height: 400, team: 'player', level: 1, turretLevel: 0, lastTurretFire: 0, activeShield: 0 },
      opponentCastle: { health: 1200, maxHealth: 1200, secondaryHealth: 1200, x: CANVAS_WIDTH - 350, width: 250, height: 400, team: 'opponent', level: 1, turretLevel: 0, lastTurretFire: 0, activeShield: 0 },
      troops: [], projectiles: [], particles: [], emotes: [],
      objective: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, radius: 100, control: 0, owner: 'neutral' },
      gold: 200, opponentGold: 200,
      lastIncomeTime: Date.now(), lastAiDecisionTime: Date.now(),
      status: 'playing', isPaused: false, isMultiplayer: false, screenShake: 0,
      cpuDifficulty: 'medium', weather: 'clear', weatherTimer: Date.now(),
      playerAbilities: { ...abilityInit }, opponentAbilities: { ...abilityInit },
      stats: { player: { ...statInit }, opponent: { ...statInit } }
    };
  }

  public reset() {
    const isMulti = this.state.isMultiplayer;
    const diff = this.state.cpuDifficulty;
    this.state = this.getInitialState();
    this.state.isMultiplayer = isMulti;
    this.state.cpuDifficulty = diff;
  }

  public setMultiplayer(enabled: boolean) { this.state.isMultiplayer = enabled; }
  public setCpuDifficulty(diff: CpuDifficulty) { this.state.cpuDifficulty = diff; }
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
    castle.secondaryHealth = castle.health;
    this.playSound('spawn');
  }

  public spawnTroop(team: Team, type: TroopType = 'basic') {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
    if (team === 'player' && this.state.gold < stats.cost) return;
    if (team === 'player') { this.state.gold -= stats.cost; this.playSound('spawn'); }
    this.createTroop(team, type);
  }

  public useAbility(team: Team, type: AbilityType) {
    const abilities = team === 'player' ? this.state.playerAbilities : this.state.opponentAbilities;
    const ability = abilities[type];
    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) return;

    ability.lastUsed = now;
    if (type === 'meteor') {
      const targetX = team === 'player' ? CANVAS_WIDTH * 0.7 : CANVAS_WIDTH * 0.3;
      for (let i = 0; i < 5; i++) {
        this.state.projectiles.push({
          id: Math.random().toString(), x: targetX + (Math.random() - 0.5) * 400, y: -200 - (i * 100),
          vx: (Math.random() - 0.5) * 5, vy: 15, team, damage: 100, type: 'meteor'
        });
      }
      this.state.screenShake = 30;
    } else if (type === 'heal') {
      this.state.troops.filter(t => t.team === team).forEach(t => {
        t.health = Math.min(t.maxHealth, t.health + 50);
        this.spawnImpactParticles(t.x, t.y - 40, '#32D74B');
      });
    } else if (type === 'shield') {
      const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
      castle.activeShield = 5000; 
    }
    this.playSound('spawn');
  }

  public spawnRemoteTroop(team: Team, type: TroopType = 'basic') { this.createTroop(team, type); }

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
      bobbingTimer: Math.random() * Math.PI * 2, kills: 0, rank: 0
    };
    this.state.troops.push(newTroop);
    this.state.stats[team].troopsSpawned++;
  }

  public update() {
    if (this.state.isPaused) return;
    const now = Date.now();
    
    // Smooth Health Bars
    const smoothFactor = 0.1;
    [this.state.playerCastle, this.state.opponentCastle].forEach(c => {
      if (c.secondaryHealth > c.health) c.secondaryHealth -= (c.secondaryHealth - c.health) * smoothFactor;
      else c.secondaryHealth = c.health;
      if (c.activeShield > 0) c.activeShield -= 16.67;
    });
    this.state.troops.forEach(t => {
      if (t.secondaryHealth > t.health) t.secondaryHealth -= (t.secondaryHealth - t.health) * smoothFactor;
      else t.secondaryHealth = t.health;
    });

    if (now - this.state.lastIncomeTime >= 1000) {
      const pL = this.state.playerCastle.level as 2 | 3;
      const oL = this.state.opponentCastle.level as 2 | 3;
      this.state.gold += 15 + (CASTLE_UPGRADES[pL]?.incomeBoost || 0);
      this.state.opponentGold += 15 + (CASTLE_UPGRADES[oL]?.incomeBoost || 0);
      this.state.lastIncomeTime = now;
    }

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
      const distToCastle = Math.abs(troop.x - (troop.team === 'player' ? enemyCastle.x : enemyCastle.x + enemyCastle.width));
      if (distToCastle <= troop.attackRange) { isBlocked = true; target = enemyCastle; }
      
      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;
        const dist = troop.team === 'player' ? other.x - troop.x : troop.x - other.x;
        if (troop.team !== other.team) {
          if (dist > 0 && dist < troop.attackRange) { isBlocked = true; target = other; }
        }
      });

      if (!isBlocked) troop.x += troop.speed;
      else if (target) {
        if (now - troop.lastAttackTime >= troop.attackCooldown) {
          if (troop.type === 'archer') this.spawnProjectile(troop, target);
          else this.dealDamage(troop, target);
          troop.lastAttackTime = now; 
          troop.isAttacking = true; 
          this.playSound('clash');
        }
      }
    });

    // Update Projectiles
    this.state.projectiles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25;
      this.state.troops.forEach(t => {
        if (t.team !== p.team && Math.abs(p.x - t.x) < 30 && Math.abs(p.y - (t.y - 40)) < 40) {
          this.dealDamage(p, t);
          if (p.type !== 'meteor') p.y = 9999;
        }
      });
      const eC = p.team === 'player' ? this.state.opponentCastle : this.state.playerCastle;
      if (p.x >= eC.x && p.x <= eC.x + eC.width && p.y >= CANVAS_HEIGHT - eC.height - 100) {
        this.dealDamage(p, eC);
        p.y = 9999;
      }
    });
    this.state.projectiles = this.state.projectiles.filter(p => p.y < CANVAS_HEIGHT && p.x >= 0 && p.x <= CANVAS_WIDTH);

    const deadTroops = this.state.troops.filter(t => t.health <= 0);
    deadTroops.forEach(t => {
        this.spawnDeathParticles(t);
        const killers = this.state.troops.filter(k => k.team !== t.team && Math.abs(k.x - t.x) < k.attackRange + 50);
        killers.forEach(k => { k.kills++; if (k.kills % 5 === 0 && k.rank < 3) k.rank++; });
        this.state.stats[t.team === 'player' ? 'opponent' : 'player'].kills++;
    });
    this.state.troops = this.state.troops.filter(t => t.health > 0);

    if (this.state.opponentCastle.health <= 0) { this.state.status = 'victory'; this.state.isPaused = true; this.playSound('game_over'); }
    else if (this.state.playerCastle.health <= 0) { this.state.status = 'defeat'; this.state.isPaused = true; this.playSound('game_over'); }
  }

  private handleAiDecision(now: number) {
    const decision = Math.random();
    const difficulty = this.state.cpuDifficulty;
    const playerTroopCount = this.state.troops.filter(t => t.team === 'player').length;
    const opponentTroopCount = this.state.troops.filter(t => t.team === 'opponent').length;
    const gold = this.state.opponentGold;

    let spawnChance = 0.4;
    let upgradeChance = 0.05;
    if (difficulty === 'easy') { spawnChance = 0.15; upgradeChance = 0.02; }
    if (difficulty === 'hard') { spawnChance = 0.7; upgradeChance = 0.15; }
    if (playerTroopCount > opponentTroopCount + 2) spawnChance += 0.3;
    if (gold > 600 && this.state.opponentCastle.level < 3) upgradeChance += 0.2;

    if (decision < upgradeChance && this.state.opponentCastle.level < 3) this.upgradeCastle('opponent');
    else if (decision < spawnChance) {
      let type: TroopType = 'basic';
      if (playerTroopCount > 3) type = 'archer';
      if (gold > 150 && Math.random() < 0.3) type = 'berserker';
      const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
      if (this.state.opponentGold >= stats.cost) { this.state.opponentGold -= stats.cost; this.createTroop('opponent', type); }
    }
    // AI using abilities
    if (difficulty === 'hard' && playerTroopCount > 5 && Math.random() < 0.01) this.useAbility('opponent', 'meteor');
    
    this.state.lastAiDecisionTime = now;
  }

  private dealDamage(attacker: Troop | Projectile, defender: Troop | Castle) {
    if (defender.activeShield && defender.activeShield > 0) return;
    const damage = 'damage' in attacker ? attacker.damage : (attacker as Troop).attackDamage;
    defender.health -= damage;
    const particleColor = 'team' in defender ? (defender.team === 'player' ? '#FF453A' : '#FFD60A') : '#A5A5A5';
    const x = 'width' in defender ? defender.x + defender.width / 2 : defender.x + (defender as Troop).size / 2;
    const y = 'y' in defender ? (defender as any).y : CANVAS_HEIGHT - 120;
    this.spawnImpactParticles(x, y, particleColor);
    if ('isTakingDamage' in defender) { (defender as Troop).isTakingDamage = true; (defender as Troop).damageFlashTimer = 8; }
    else { this.state.screenShake = 12; }
    const attackerTeam = 'team' in attacker ? attacker.team : (attacker as Troop).team;
    this.state.stats[attackerTeam].damageDealt += damage;
  }

  private spawnImpactParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 5; i++) {
      this.state.particles.push({
        id: Math.random().toString(36).substr(2, 9), x, y,
        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 2, color, life: 0.8
      });
    }
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

  private spawnProjectile(attacker: Troop, target: Troop | Castle) {
    const id = Math.random().toString(36).substr(2, 9);
    const dx = target.x - attacker.x;
    const dy = -150;
    const time = Math.abs(dx) / 10;
    this.state.projectiles.push({
      id, x: attacker.x, y: attacker.y - 60,
      vx: dx / time, vy: dy / time,
      team: attacker.team, damage: attacker.attackDamage, type: 'arrow'
    });
  }

  private playSound(type: 'spawn' | 'clash' | 'game_over') { if (this.audioEnabled) console.log(`[AUDIO] ${type}`); }
  public enableAudio() { this.audioEnabled = true; }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.state.screenShake > 0) ctx.translate((Math.random() - 0.5) * this.state.screenShake, (Math.random() - 0.5) * this.state.screenShake);
    if (this.assets.bg.complete) ctx.drawImage(this.assets.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    else { ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); }

    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);
    this.state.troops.forEach(t => this.drawTroop(ctx, t));
    this.state.projectiles.forEach(p => this.drawProjectile(ctx, p));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));
    ctx.restore();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 80 - castle.height;
    const isUpgraded = castle.level > 1;
    if (isUpgraded) {
        ctx.save(); ctx.shadowBlur = 40;
        ctx.shadowColor = castle.team === 'player' ? 'rgba(50, 215, 75, 0.3)' : 'rgba(255, 69, 58, 0.3)';
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.2;
    }
    if (this.assets.castle.complete) {
        ctx.save();
        if (castle.team === 'opponent') { ctx.translate(castle.x + castle.width, 0); ctx.scale(-1, 1); ctx.drawImage(this.assets.castle, 0, y, castle.width, castle.height); }
        else ctx.drawImage(this.assets.castle, castle.x, y, castle.width, castle.height);
        ctx.restore();
    }
    if (isUpgraded) ctx.restore();
    const bW = castle.width; const bH = 12; const bX = castle.x; const bY = y - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.roundRect(ctx, bX, bY, bW, bH, 6); ctx.fill();
    const secondaryP = Math.max(0, castle.secondaryHealth / castle.maxHealth);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; this.roundRect(ctx, bX, bY, bW * secondaryP, bH, 6); ctx.fill();
    const hpP = Math.max(0, castle.health / castle.maxHealth);
    const grad = ctx.createLinearGradient(bX, 0, bX + bW, 0);
    if (castle.team === 'player') { grad.addColorStop(0, '#32D74B'); grad.addColorStop(1, '#248A32'); }
    else { grad.addColorStop(0, '#FF453A'); grad.addColorStop(1, '#A02A23'); }
    ctx.fillStyle = grad; this.roundRect(ctx, bX, bY, bW * hpP, bH, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.beginPath(); ctx.arc(bX + bW/2, bY - 15, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E2B759'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center'; ctx.fillText(`LVL ${castle.level}`, bX + bW/2, bY - 11);
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const img = this.assets[troop.type === 'basic' ? 'knight' : troop.type];
    const bob = Math.sin(troop.bobbingTimer) * 4;
    if (img && img.complete) {
        ctx.save(); ctx.translate(troop.x, troop.y - troop.size + bob);
        if (troop.team === 'opponent') { ctx.translate(troop.size, 0); ctx.scale(-1, 1); }
        if (troop.isTakingDamage) ctx.filter = 'brightness(2) saturate(2)';
        ctx.drawImage(img, 0, 0, troop.size, troop.size);
        // Rank Indicator
        if (troop.rank > 0) {
            ctx.fillStyle = '#E2B759';
            for (let i = 0; i < troop.rank; i++) ctx.fillRect(10 + (i * 12), -10, 8, 8);
        }
        ctx.restore();
    }
    const bW = troop.size; const bH = 6; const bX = troop.x; const bY = troop.y - troop.size - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.roundRect(ctx, bX, bY, bW, bH, 3); ctx.fill();
    const secondaryP = Math.max(0, troop.secondaryHealth / troop.maxHealth);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; this.roundRect(ctx, bX, bY, bW * secondaryP, bH, 3); ctx.fill();
    const hpP = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = troop.team === 'player' ? '#32D74B' : '#FF453A';
    this.roundRect(ctx, bX, bY, bW * hpP, bH, 3); ctx.fill();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.strokeStyle = p.type === 'meteor' ? '#FF453A' : '#fff';
    ctx.lineWidth = p.type === 'meteor' ? 6 : 3;
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = p.type === 'meteor' ? '#FFD60A' : '#fff';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.fill();
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 0) w = 0; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
}
