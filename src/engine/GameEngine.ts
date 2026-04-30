import { GameState, Troop, Castle, Team, Particle, TroopType, CpuDifficulty, Projectile, AbilityType, WeatherType, Emote, MatchStats } from './types';

export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 900;
export const VIEW_WIDTH = 1600;

export const TROOP_STATS = {
  BASIC: { cost: 20, health: 120, attackDamage: 12, attackRange: 50, attackCooldown: 800, speed: 2.8, size: 65, asset: 'knight', maxCount: 20 },
  ARCHER: { cost: 45, health: 80, attackDamage: 25, attackRange: 450, attackCooldown: 1500, speed: 2.2, size: 65, asset: 'archer', maxCount: 15 },
  BERSERKER: { cost: 75, health: 320, attackDamage: 40, attackRange: 60, attackCooldown: 700, speed: 3.5, size: 80, asset: 'berserker', maxCount: 10 },
  HERO: { cost: 300, health: 1000, attackDamage: 60, attackRange: 80, attackCooldown: 600, speed: 4.0, size: 95, asset: 'knight', maxCount: 1 },
  FIRE_ARCHER: { cost: 100, health: 120, attackDamage: 35, attackRange: 500, attackCooldown: 1800, speed: 2.0, size: 70, asset: 'archer', maxCount: 8 },
  CROSSMAN: { cost: 120, health: 180, attackDamage: 50, attackRange: 350, attackCooldown: 2200, speed: 1.8, size: 75, asset: 'archer', maxCount: 6 }
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
      shield: { cooldown: 25000, lastUsed: 0 },
      lightning: { cooldown: 12000, lastUsed: 0 },
      superMeteor: { cooldown: 45000, lastUsed: 0 },
      moon: { cooldown: 35000, lastUsed: 0 },
      superHeal: { cooldown: 60000, lastUsed: 0 },
      iceFreeze: { cooldown: 25000, lastUsed: 0 }
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
      stats: { player: { ...statInit }, opponent: { ...statInit } },
      cameraX: 0, isAutoCamera: true, lastManualScroll: 0
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
  public setCameraX(x: number) { 
    this.state.cameraX = Math.max(0, Math.min(CANVAS_WIDTH - 1600, x));
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
    this.playSound('spawn');
  }

  public spawnTroop(team: Team, type: TroopType = 'basic') {
    const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
    if (team === 'player' && this.state.gold < stats.cost) return;
    
    // Strict separate population logic
    const currentCount = this.state.troops.filter(t => t.team === team && t.type === type).length;
    if (currentCount >= stats.maxCount) return;

    if (team === 'player') { this.state.gold -= stats.cost; this.playSound('spawn'); }
    this.createTroop(team, type);
  }

  public useAbility(team: Team, type: AbilityType, targetX?: number) {
    const abilities = team === 'player' ? this.state.playerAbilities : this.state.opponentAbilities;
    const ability = abilities[type];
    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) return;

    ability.lastUsed = now;
    const x = targetX ?? (team === 'player' ? CANVAS_WIDTH * 0.7 : CANVAS_WIDTH * 0.3);

    if (type === 'meteor') {
      for (let i = 0; i < 8; i++) {
        this.state.projectiles.push({
          id: Math.random().toString(), x: x + (Math.random() - 0.5) * 300, y: -200 - (i * 100),
          vx: (Math.random() - 0.5) * 3, vy: 18, team, damage: 120, type: 'meteor'
        });
      }
      this.state.screenShake = 40;
    } else if (type === 'superMeteor') {
      for (let i = 0; i < 20; i++) {
        this.state.projectiles.push({
          id: Math.random().toString(), x: x + (Math.random() - 0.5) * 800, y: -400 - (i * 50),
          vx: (Math.random() - 0.5) * 4, vy: 22, team, damage: 200, type: 'meteor'
        });
      }
      this.state.screenShake = 100;
    } else if (type === 'lightning') {
        this.state.troops.filter(t => t.team !== team && Math.abs(t.x - x) < 150).forEach(t => {
            t.health -= 500;
            this.spawnImpactParticles(t.x, t.y - 100, '#64D2FF');
        });
        this.state.screenShake = 20;
    } else if (type === 'heal') {
      this.state.troops.filter(t => t.team === team && Math.abs(t.x - x) < 400).forEach(t => {
        t.health = Math.min(t.maxHealth, t.health + 100);
        this.spawnImpactParticles(t.x, t.y - 40, '#32D74B');
      });
    } else if (type === 'superHeal') {
        this.state.troops.filter(t => t.team === team).forEach(t => {
            t.health = t.maxHealth;
            this.spawnImpactParticles(t.x, t.y - 40, '#32D74B');
        });
        const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
        castle.health = Math.min(castle.maxHealth, castle.health + 500);
    } else if (type === 'shield') {
      const castle = team === 'player' ? this.state.playerCastle : this.state.opponentCastle;
      castle.activeShield = 8000; 
    } else if (type === 'iceFreeze') {
        this.state.troops.filter(t => t.team !== team && Math.abs(t.x - x) < 500).forEach(t => {
            t.isFrozen = true;
            t.freezeTimer = 5000;
            this.spawnImpactParticles(t.x, t.y - 40, '#64D2FF');
        });
    } else if (type === 'moon') {
        this.state.troops.filter(t => t.team !== team && Math.abs(t.x - x) < 600).forEach(t => {
            t.x += (x - t.x) * 0.5; // Pull towards moon center
            t.health -= 50;
        });
        this.state.screenShake = 15;
    }
    this.playSound('spawn');
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
      isFrozen: false, freezeTimer: 0
    };
    this.state.troops.push(newTroop);
    this.state.stats[team].troopsSpawned++;
  }

  public update() {
    if (this.state.isPaused) return;
    const now = Date.now();
    
    // 0. Camera Logic
    if (now - this.state.lastManualScroll > 3000) this.state.isAutoCamera = true;
    if (this.state.isAutoCamera) {
        const playerTroops = this.state.troops.filter(t => t.team === 'player');
        const frontX = playerTroops.length > 0 ? Math.max(...playerTroops.map(t => t.x)) : 0;
        const targetCamX = Math.max(0, Math.min(CANVAS_WIDTH - 1600, frontX - 800));
        this.state.cameraX += (targetCamX - this.state.cameraX) * 0.1;
    }

    // 1. Smooth Health Bars & Shields
    const smoothFactor = 0.1;
    [this.state.playerCastle, this.state.opponentCastle].forEach(c => {
      if (c.secondaryHealth > c.health) c.secondaryHealth -= (c.secondaryHealth - c.health) * smoothFactor;
      else c.secondaryHealth = c.health;
      if (c.activeShield > 0) c.activeShield -= 16.67;
    });
    this.state.troops.forEach(t => {
      if (t.secondaryHealth > t.health) t.secondaryHealth -= (t.secondaryHealth - t.health) * smoothFactor;
      else t.secondaryHealth = t.health;
      
      // Freeze Logic
      if (t.isFrozen) {
          t.freezeTimer -= 16.67;
          if (t.freezeTimer <= 0) t.isFrozen = false;
      }
    });

    // 2. Weather Logic (Temporarily Disabled/Always Clear)
    this.state.weather = 'clear';

    // 3. Objective Control
    let playerInfluence = 0;
    let opponentInfluence = 0;
    this.state.troops.forEach(t => {
      const dist = Math.abs(t.x - this.state.objective.x);
      if (dist < this.state.objective.radius) {
        if (t.team === 'player') playerInfluence++; else opponentInfluence++;
      }
    });
    const netInfluence = playerInfluence - opponentInfluence;
    this.state.objective.control = Math.max(-100, Math.min(100, this.state.objective.control + netInfluence * 0.5));
    if (this.state.objective.control >= 100) this.state.objective.owner = 'player';
    else if (this.state.objective.control <= -100) this.state.objective.owner = 'opponent';

    // 4. Income
    if (now - this.state.lastIncomeTime >= 1000) {
      const pL = this.state.playerCastle.level as 2 | 3;
      const oL = this.state.opponentCastle.level as 2 | 3;
      let pInc = 15 + (CASTLE_UPGRADES[pL]?.incomeBoost || 0);
      let oInc = 15 + (CASTLE_UPGRADES[oL]?.incomeBoost || 0);
      if (this.state.objective.owner === 'player') pInc += 10;
      else if (this.state.objective.owner === 'opponent') oInc += 10;
      this.state.gold += pInc;
      this.state.opponentGold += oInc;
      this.state.lastIncomeTime = now;
    }

    // 5. Turret Logic
    [this.state.playerCastle, this.state.opponentCastle].forEach(c => {
      if (c.level >= 2 && now - c.lastTurretFire > 2000) {
        const target = this.state.troops.find(t => t.team !== c.team && Math.abs(t.x - (c.x + c.width/2)) < 600);
        if (target) {
            this.spawnProjectile({ 
                x: c.x + c.width/2, y: CANVAS_HEIGHT - c.height - 100, team: c.team, 
                attackDamage: 20 * c.level, id: 'turret' 
            } as any, target);
            c.lastTurretFire = now;
        }
      }
    });

    // 6. Emote Logic
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
      
      let currentSpeed = 0;
      if (troop.isFrozen) {
          // No movement while frozen
      } else if (troop.state === 'advancing') {
          currentSpeed = troop.speed;
      } else if (troop.state === 'retreating') {
          const homeX = troop.team === 'player' ? this.state.playerCastle.x + this.state.playerCastle.width : this.state.opponentCastle.x;
          if (Math.abs(troop.x - homeX) > 20) {
              currentSpeed = troop.team === 'player' ? -Math.abs(troop.speed) : Math.abs(troop.speed);
          } else {
              troop.state = 'idle';
          }
      }

      const distToCastle = Math.abs(troop.x - (troop.team === 'player' ? enemyCastle.x : enemyCastle.x + enemyCastle.width));
      if (distToCastle <= currentRange) { isBlocked = true; target = enemyCastle; }
      
      this.state.troops.forEach((other) => {
        if (troop.id === other.id) return;
        const dist = troop.team === 'player' ? other.x - troop.x : troop.x - other.x;
        if (troop.team !== other.team) {
          if (dist > 0 && dist < currentRange) { isBlocked = true; target = other; }
        }
      });

      if (!isBlocked && troop.state !== 'idle' && !troop.isFrozen) troop.x += currentSpeed;
      else if (target && troop.state === 'advancing' && !troop.isFrozen) {
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
    const difficulty = this.state.cpuDifficulty;
    const playerTroops = this.state.troops.filter(t => t.team === 'player');
    const opponentTroops = this.state.troops.filter(t => t.team === 'opponent');
    const gold = this.state.opponentGold;
    const castle = this.state.opponentCastle;

    if (difficulty === 'hard') {
        const nearbyThreats = playerTroops.filter(t => t.x > castle.x - 400);
        if (nearbyThreats.length > 2 && gold >= 20) { this.createTroop('opponent', 'basic'); this.state.opponentGold -= 20; }
        if (castle.health < castle.maxHealth * 0.3 && now - this.state.opponentAbilities.shield.lastUsed > 30000) this.useAbility('opponent', 'shield');
        
        if (gold > 100) {
            const playerArchers = playerTroops.filter(t => t.type === 'archer').length;
            if (playerArchers > 2) { this.createTroop('opponent', 'berserker'); this.state.opponentGold -= 75; }
            else if (playerTroops.length > 5) this.useAbility('opponent', 'meteor');
            else {
                const type = Math.random() < 0.7 ? 'basic' : 'archer';
                const cost = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS].cost;
                if (gold >= cost) { this.createTroop('opponent', type); this.state.opponentGold -= cost; }
            }
        }
        if (this.state.objective.owner !== 'opponent' && gold > 200 && opponentTroops.length < 3) { this.createTroop('opponent', 'berserker'); this.state.opponentGold -= 75; }
        if (gold > 400 && !opponentTroops.find(t => t.type === 'hero')) { this.createTroop('opponent', 'hero'); this.state.opponentGold -= 300; }
        
        if (opponentTroops.filter(t => t.state === 'idle').length > 3) this.issueCommand('opponent', 'charge');
        if (nearbyThreats.length > 5 && opponentTroops.length < 2) this.issueCommand('opponent', 'retreat');
    } else {
        const decision = Math.random();
        let spawnChance = 0.4;
        if (difficulty === 'easy') spawnChance = 0.15;
        if (playerTroops.length > opponentTroops.length + 2) spawnChance += 0.3;
        if (decision < spawnChance) {
          let type: TroopType = 'basic';
          if (playerTroops.length > 3) type = 'archer';
          const stats = TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS] || TROOP_STATS.BASIC;
          if (this.state.opponentGold >= stats.cost) { this.state.opponentGold -= stats.cost; this.createTroop('opponent', type); }
        }
        if (opponentTroops.filter(t => t.state === 'idle').length > 0) this.issueCommand('opponent', 'charge');
    }
    this.state.lastAiDecisionTime = now;
  }

  private dealDamage(attacker: Troop | Projectile, defender: Troop | Castle) {
    if ('activeShield' in defender && defender.activeShield > 0) return;
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
    if (this.assets.bg.complete) {
        for (let i = 0; i < 3; i++) ctx.drawImage(this.assets.bg, (i * CANVAS_WIDTH/2) - this.state.cameraX * 0.5, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, VIEW_WIDTH, CANVAS_HEIGHT);
    }
    ctx.translate(-this.state.cameraX, 0);
    this.drawObjective(ctx);
    this.drawCastle(ctx, this.state.playerCastle);
    this.drawCastle(ctx, this.state.opponentCastle);
    
    const playerVisionX = Math.max(...this.state.troops.filter(t => t.team === 'player').map(t => t.x), 400);
    this.state.troops.forEach(t => { 
        if (t.team === 'opponent' && t.x > playerVisionX + 500) return; 
        this.drawTroop(ctx, t); 
    });
    this.state.projectiles.forEach(p => this.drawProjectile(ctx, p));
    this.state.particles.forEach(p => this.drawParticle(ctx, p));
    this.state.emotes.forEach(e => this.drawEmote(ctx, e));

    this.drawWeather(ctx);
    ctx.restore();
  }

  private drawObjective(ctx: CanvasRenderingContext2D) {
    const obj = this.state.objective; ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'; ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = obj.control > 0 ? '#32D74B' : '#FF453A'; ctx.beginPath(); ctx.moveTo(obj.x, obj.y);
    ctx.arc(obj.x, obj.y, obj.radius, -Math.PI / 2, -Math.PI / 2 + (Math.abs(obj.control) / 100) * (Math.PI * 2)); ctx.fill();
    ctx.fillStyle = '#E2B759'; ctx.font = 'bold 20px Inter'; ctx.textAlign = 'center'; ctx.fillText('GOLD MINE', obj.x, obj.y - obj.radius - 20);
    ctx.restore();
  }

  private drawCastle(ctx: CanvasRenderingContext2D, castle: Castle) {
    const y = CANVAS_HEIGHT - 80 - castle.height;
    if (this.assets.castle.complete) {
        ctx.save();
        if (castle.team === 'opponent') { ctx.translate(castle.x + castle.width, 0); ctx.scale(-1, 1); ctx.drawImage(this.assets.castle, 0, y, castle.width, castle.height); }
        else ctx.drawImage(this.assets.castle, castle.x, y, castle.width, castle.height);
        ctx.restore();
    }
    if (castle.activeShield > 0) {
        ctx.save(); ctx.strokeStyle = '#64D2FF'; ctx.lineWidth = 8; ctx.beginPath();
        ctx.arc(castle.x + castle.width/2, y + castle.height/2, castle.height/2 + 20, 0, Math.PI*2); ctx.stroke(); ctx.restore();
    }
    const bW = castle.width; const bH = 12; const bX = castle.x; const bY = y - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.roundRect(ctx, bX, bY, bW, bH, 6); ctx.fill();
    const hpP = Math.max(0, castle.health / castle.maxHealth);
    ctx.fillStyle = castle.team === 'player' ? '#32D74B' : '#FF453A'; this.roundRect(ctx, bX, bY, bW * hpP, bH, 6); ctx.fill();
  }

  private drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
    const img = this.assets[troop.type === 'basic' ? 'knight' : troop.type === 'hero' ? 'knight' : troop.type];
    const bob = Math.sin(troop.bobbingTimer) * 4;
    ctx.save(); ctx.translate(troop.x, troop.y - troop.size + bob);
    if (img && img.complete) {
        if (troop.team === 'opponent') { ctx.translate(troop.size, 0); ctx.scale(-1, 1); }
        if (troop.isTakingDamage) ctx.filter = 'brightness(2) saturate(2)';
        if (troop.isFrozen) ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
        ctx.drawImage(img, 0, 0, troop.size, troop.size);
    }
    ctx.restore();
    const bW = troop.size; const bH = 6; const bX = troop.x; const bY = troop.y - troop.size - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.roundRect(ctx, bX, bY, bW, bH, 3); ctx.fill();
    const hpP = Math.max(0, troop.health / troop.maxHealth);
    ctx.fillStyle = troop.team === 'player' ? '#32D74B' : '#FF453A';
    this.roundRect(ctx, bX, bY, bW * hpP, bH, 3); ctx.fill();
  }

  private drawEmote(ctx: CanvasRenderingContext2D, e: Emote) {
    ctx.save(); ctx.globalAlpha = e.life; ctx.fillStyle = '#fff'; ctx.font = '40px Inter'; ctx.textAlign = 'center';
    ctx.fillText(e.type, e.x, e.y - (1 - e.life) * 50); ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.strokeStyle = p.type === 'meteor' ? '#FF453A' : '#fff'; ctx.lineWidth = p.type === 'meteor' ? 6 : 3;
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
  }

  private drawWeather(ctx: CanvasRenderingContext2D) {
    // Weather effects temporarily removed
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 0) w = 0; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
}
