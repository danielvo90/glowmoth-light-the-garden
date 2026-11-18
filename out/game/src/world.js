// The game's rules and state, with no drawing and no browser in it: the glowmoth, the
// drifting light orbs, the shadow wisps, the shield blossoms and the five lanterns.
// step() advances one fixed step and returns what happened as bit flags, so the caller
// can react (sound, announcements) without the world knowing about screens or sound.
// Nothing here allocates after createWorld returns.
import {
  BLOSSOM,
  COMBO,
  FIELD,
  LANTERN_GLOW_NEEDED,
  LANTERN_POINTS,
  LANTERN_SPOTS,
  LIVES,
  NIGHT_SECONDS,
  ORB,
  PLAYER,
  POOL_SIZE,
  WISP,
  WIN_TIME_BONUS_PER_SECOND,
} from './config.js';

export const KIND_ORB = 0;
export const KIND_WISP = 1;
export const KIND_BLOSSOM = 2;

export const EVENT_ORB = 1;
export const EVENT_LIGHT = 2;
export const EVENT_HIT = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_SHIELD = 32;
export const EVENT_DASH = 64;

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createWorld(random) {
  const player = {
    x: FIELD.width / 2,
    y: FIELD.height / 2 + 120,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    dashTime: 0,
    dashCooldown: 0,
    invulnerable: 0,
    shield: false,
    wingPhase: 0,
  };
  const orbs = [];
  const wisps = [];
  const blossoms = [];
  const particles = [];
  for (let i = 0; i < POOL_SIZE; i += 1) {
    orbs.push({ active: false, x: 0, y: 0, radius: ORB.radius, phase: 0, vx: 0, vy: 0 });
    wisps.push({ active: false, x: 0, y: 0, radius: WISP.radius, phase: 0, speed: 0, wobble: 0 });
    blossoms.push({ active: false, x: 0, y: 0, radius: BLOSSOM.radius, phase: 0 });
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 3, color: '#ffffff' });
  }
  const lanterns = LANTERN_SPOTS.map((spot) => ({ x: spot.x, y: spot.y, lit: false }));
  const state = {
    player,
    orbs,
    wisps,
    blossoms,
    particles,
    lanterns,
    score: 0,
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    glow: 0,
    lives: LIVES,
    lanternsLit: 0,
    timeLeft: NIGHT_SECONDS,
    elapsed: 0,
    orbTimer: 0.4,
    wispTimer: WISP.interval,
    blossomTimer: BLOSSOM.interval,
  };

  function reset() {
    player.x = FIELD.width / 2;
    player.y = FIELD.height / 2 + 120;
    player.vx = 0;
    player.vy = 0;
    player.dashTime = 0;
    player.dashCooldown = 0;
    player.invulnerable = 0;
    player.shield = false;
    for (const item of orbs) item.active = false;
    for (const item of wisps) item.active = false;
    for (const item of blossoms) item.active = false;
    for (const item of particles) item.active = false;
    for (const lantern of lanterns) lantern.lit = false;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
    state.glow = 0;
    state.lives = LIVES;
    state.lanternsLit = 0;
    state.timeLeft = NIGHT_SECONDS;
    state.elapsed = 0;
    state.orbTimer = 0.4;
    state.wispTimer = WISP.interval;
    state.blossomTimer = BLOSSOM.interval;
  }

  function free(pool) {
    for (let i = 0; i < pool.length; i += 1) if (!pool[i].active) return pool[i];
    return null;
  }

  function burst(x, y, color, count, speed) {
    let made = 0;
    for (let i = 0; i < particles.length && made < count; i += 1) {
      const p = particles[i];
      if (p.active) continue;
      const angle = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * v;
      p.vy = Math.sin(angle) * v;
      p.life = 0.5 + random() * 0.4;
      p.maxLife = p.life;
      p.size = 2 + random() * 3;
      p.color = color;
      made += 1;
    }
  }

  function spawnOrb() {
    const orb = free(orbs);
    if (orb === null) return;
    orb.active = true;
    orb.x = 60 + random() * (FIELD.width - 120);
    orb.y = 70 + random() * (FIELD.height - 170);
    orb.phase = random() * Math.PI * 2;
    orb.vx = (random() - 0.5) * ORB.drift;
    orb.vy = (random() - 0.5) * ORB.drift;
  }

  function spawnWisp() {
    const wisp = free(wisps);
    if (wisp === null) return;
    const edge = Math.floor(random() * 4);
    if (edge === 0) { wisp.x = -30; wisp.y = random() * FIELD.height; }
    else if (edge === 1) { wisp.x = FIELD.width + 30; wisp.y = random() * FIELD.height; }
    else if (edge === 2) { wisp.x = random() * FIELD.width; wisp.y = -30; }
    else { wisp.x = random() * FIELD.width; wisp.y = FIELD.height + 30; }
    wisp.active = true;
    wisp.phase = random() * Math.PI * 2;
    wisp.wobble = 0.6 + random() * 1.1;
    wisp.speed = WISP.speed + WISP.speedPerLantern * state.lanternsLit + random() * 30;
  }

  function spawnBlossom() {
    const blossom = free(blossoms);
    if (blossom === null) return;
    blossom.active = true;
    blossom.x = 80 + random() * (FIELD.width - 160);
    blossom.y = 90 + random() * (FIELD.height - 220);
    blossom.phase = random() * Math.PI * 2;
  }

  function wispInterval() {
    return Math.max(WISP.minInterval, WISP.interval * WISP.intervalScale ** state.lanternsLit);
  }

  function applyCombo() {
    state.multiplier = Math.min(COMBO.maxMultiplier, 1 + Math.floor(state.combo / COMBO.perTier) * 0.5);
  }

  /**
   * One fixed step. `input` is { x, y } a unit-ish steering vector and { dash }.
   * With `harmless` set (the title screen's backdrop) things drift but nothing is
   * collected, no lantern lights and nothing hurts the moth.
   */
  function step(dt, input, harmless) {
    let events = 0;
    state.elapsed += dt;
    if (!harmless) state.timeLeft = Math.max(0, state.timeLeft - dt);

    // Steering and dash.
    const magnitude = Math.hypot(input.x, input.y) || 1;
    const nx = magnitude > 0.01 ? input.x / Math.max(1, magnitude) : 0;
    const ny = magnitude > 0.01 ? input.y / Math.max(1, magnitude) : 0;
    if (input.dash && player.dashCooldown <= 0 && player.dashTime <= 0 && (nx !== 0 || ny !== 0)) {
      player.dashTime = PLAYER.dashTime;
      player.dashCooldown = PLAYER.dashCooldown;
      events |= EVENT_DASH;
    }
    const speed = player.dashTime > 0 ? PLAYER.dashSpeed : PLAYER.speed;
    player.vx = nx * speed;
    player.vy = ny * speed;
    player.x = Math.min(FIELD.width - player.radius, Math.max(player.radius, player.x + player.vx * dt));
    player.y = Math.min(FIELD.height - player.radius, Math.max(player.radius, player.y + player.vy * dt));
    player.wingPhase += dt * (player.dashTime > 0 ? 34 : 18);
    if (player.dashTime > 0) player.dashTime -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        applyCombo();
      }
    }

    // Spawning.
    state.orbTimer -= dt;
    if (state.orbTimer <= 0) {
      spawnOrb();
      state.orbTimer += ORB.interval + random() * ORB.intervalJitter;
    }
    state.wispTimer -= dt;
    if (state.wispTimer <= 0) {
      spawnWisp();
      state.wispTimer += wispInterval();
    }
    state.blossomTimer -= dt;
    if (state.blossomTimer <= 0) {
      spawnBlossom();
      state.blossomTimer += BLOSSOM.interval;
    }

    // Orbs drift and are collected.
    for (const orb of orbs) {
      if (!orb.active) continue;
      orb.phase += dt * 2;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (orb.x < 30 || orb.x > FIELD.width - 30) orb.vx = -orb.vx;
      if (orb.y < 30 || orb.y > FIELD.height - 30) orb.vy = -orb.vy;
      if (harmless) continue;
      if (distance(orb.x, orb.y, player.x, player.y) < orb.radius + player.radius) {
        orb.active = false;
        state.glow += 1;
        state.combo += 1;
        state.comboTimer = COMBO.window;
        applyCombo();
        const gained = Math.round(ORB.points * state.multiplier);
        state.score += gained;
        burst(orb.x, orb.y, '#ffd94d', 8, 120);
        events |= EVENT_ORB;
      }
    }

    // Blossoms grant a shield.
    for (const blossom of blossoms) {
      if (!blossom.active) continue;
      blossom.phase += dt * 2;
      if (harmless) continue;
      if (distance(blossom.x, blossom.y, player.x, player.y) < blossom.radius + player.radius) {
        blossom.active = false;
        player.shield = true;
        burst(blossom.x, blossom.y, '#ff8fb8', 10, 130);
        events |= EVENT_SHIELD;
      }
    }

    // Lanterns light when the moth arrives carrying glow.
    for (const lantern of lanterns) {
      if (lantern.lit || harmless) continue;
      if (state.glow >= LANTERN_GLOW_NEEDED && distance(lantern.x, lantern.y, player.x, player.y) < 46 + player.radius) {
        lantern.lit = true;
        state.glow -= LANTERN_GLOW_NEEDED;
        state.lanternsLit += 1;
        state.score += LANTERN_POINTS;
        burst(lantern.x, lantern.y - 20, '#ffb347', 18, 190);
        events |= EVENT_LIGHT;
        if (state.lanternsLit === lanterns.length) {
          state.score += Math.round(state.timeLeft) * WIN_TIME_BONUS_PER_SECOND;
          events |= EVENT_WIN;
          return events;
        }
      }
    }

    // Wisps hunt the moth.
    for (const wisp of wisps) {
      if (!wisp.active) continue;
      wisp.phase += dt * wisp.wobble;
      const dx = player.x - wisp.x;
      const dy = player.y - wisp.y;
      const d = Math.hypot(dx, dy) || 1;
      const wobbleX = Math.cos(wisp.phase) * 26;
      const wobbleY = Math.sin(wisp.phase * 1.3) * 26;
      wisp.x += (dx / d * wisp.speed + wobbleX) * dt;
      wisp.y += (dy / d * wisp.speed + wobbleY) * dt;
      if (wisp.x < -60 || wisp.x > FIELD.width + 60 || wisp.y < -60 || wisp.y > FIELD.height + 60) {
        wisp.active = false;
        continue;
      }
      if (harmless) continue;
      if (distance(wisp.x, wisp.y, player.x, player.y) < wisp.radius + player.radius - 4) {
        if (player.dashTime > 0 || player.invulnerable > 0) continue;
        wisp.active = false;
        if (player.shield) {
          player.shield = false;
          player.invulnerable = PLAYER.invulnerable;
          burst(player.x, player.y, '#ff8fb8', 12, 160);
          events |= EVENT_HIT;
          continue;
        }
        state.lives -= 1;
        state.combo = 0;
        applyCombo();
        player.invulnerable = PLAYER.invulnerable;
        burst(player.x, player.y, '#7a5cff', 14, 170);
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // Particles fade.
    for (const p of particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    if (!harmless && state.timeLeft <= 0 && state.lanternsLit < lanterns.length) {
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, burst };
}
