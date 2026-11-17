// The game's rules and state, with no drawing and no browser in it: the koi, the
// pool of river things, spawning, collisions, score, combo, lives and waves.
// step() advances one fixed step and returns what happened as bit flags, so the
// caller can react (sound, announcements) without the world knowing about screens
// or sound. Nothing here allocates after createWorld returns.

import { FIELD, HERON, KOI, LIVES, LOTUS, PEARL, POOL_SIZE, ROCK, SCALE, WAVE, WHIRL, WIN_SCORE } from './config.js';

export const KIND_PEARL = 0;
export const KIND_LOTUS = 1;
export const KIND_SCALE = 2;
export const KIND_ROCK = 3;
export const KIND_WHIRL = 4;
export const KIND_HERON = 5;

export const EVENT_PEARL = 1;
export const EVENT_LOTUS = 2;
export const EVENT_SCALE = 4;
export const EVENT_HIT = 8;
export const EVENT_OVER = 16;
export const EVENT_WIN = 32;

function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

export function createWorld(random) {
  const koi = {
    x: FIELD.width / 2, y: FIELD.height * 0.62, radius: KOI.radius,
    vx: 0, vy: 0, angle: -Math.PI / 2, invulnerable: 0,
    dash: 0, dashX: 0, dashY: 0, swim: 0,
  };
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({ active: false, kind: KIND_PEARL, x: 0, y: 0, radius: 0, speed: 0, vx: 0, phase: 0, bob: 0 });
  }
  const particles = [];
  for (let index = 0; index < 48; index += 1) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#ffffff' });
  }
  const state = {
    koi, items, particles, score: 0, combo: 0, bestCombo: 0, lives: LIVES,
    wave: 1, elapsed: 0, scroll: 0, dashReady: true, dashTimer: 0,
    pearlTimer: 0.4, rockTimer: 1.2, lotusTimer: 6, scaleTimer: 11, heronTimer: 14,
  };

  function reset() {
    koi.x = FIELD.width / 2;
    koi.y = FIELD.height * 0.62;
    koi.vx = 0; koi.vy = 0; koi.angle = -Math.PI / 2;
    koi.invulnerable = 0; koi.dash = 0; koi.swim = 0;
    for (const item of items) item.active = false;
    for (const p of particles) p.active = false;
    state.score = 0; state.combo = 0; state.bestCombo = 0; state.lives = LIVES;
    state.wave = 1; state.elapsed = 0; state.scroll = 0; state.dashReady = true; state.dashTimer = 0;
    state.pearlTimer = 0.4; state.rockTimer = 1.2; state.lotusTimer = 6;
    state.scaleTimer = 11; state.heronTimer = 14;
  }

  function freeItem() {
    for (let index = 0; index < items.length; index += 1) if (!items[index].active) return items[index];
    return null;
  }

  function spawn(kind, x, y, radius, speed) {
    const item = freeItem();
    if (item === null) return;
    item.active = true; item.kind = kind;
    item.x = x; item.y = y; item.radius = radius; item.speed = speed;
    item.vx = 0; item.phase = random() * Math.PI * 2; item.bob = 0;
  }

  function burst(x, y, color, count, speed) {
    let made = 0;
    for (let index = 0; index < particles.length && made < count; index += 1) {
      const p = particles[index];
      if (p.active) continue;
      const a = random() * Math.PI * 2;
      p.active = true; p.x = x; p.y = y;
      p.vx = Math.cos(a) * speed * (0.4 + random() * 0.6);
      p.vy = Math.sin(a) * speed * (0.4 + random() * 0.6) - 40;
      p.max = 0.5 + random() * 0.4; p.life = p.max;
      p.size = 2 + random() * 4; p.color = color;
      made += 1;
    }
  }

  function waveSpeed() { return 1 + (state.wave - 1) * 0.22; }

  /**
   * One fixed step. `move` is {x, y} in -1..1 (keys, or a unit vector toward the
   * pointer), `dash` starts a dash when one is ready. With `harmless` set (the
   * title screen's backdrop) things drift but nothing touches the koi and nothing
   * scores. Returns EVENT_* flags.
   */
  function step(dt, move, dash, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.wave = Math.min(WAVE.max, 1 + Math.floor(state.elapsed / WAVE.seconds));
    state.scroll += dt * 46;

    // --- koi movement ---
    if (state.dashTimer > 0) {
      state.dashTimer -= dt;
      if (state.dashTimer <= 0) state.dashReady = true;
    }
    if (dash && state.dashReady && koi.dash === 0) {
      koi.dash = KOI.dashTime;
      state.dashReady = false;
      state.dashTimer = 2.5;
      const len = Math.hypot(move.x, move.y);
      koi.dashX = len > 0.01 ? move.x / len : Math.cos(koi.angle);
      koi.dashY = len > 0.01 ? move.y / len : Math.sin(koi.angle);
      events |= EVENT_SCALE;
    }
    if (koi.dash > 0) {
      koi.dash -= dt;
      koi.vx = koi.dashX * KOI.dashSpeed;
      koi.vy = koi.dashY * KOI.dashSpeed;
      koi.invulnerable = Math.max(koi.invulnerable, 0.12);
    } else {
      const speed = KOI.speed;
      koi.vx = move.x * speed;
      koi.vy = move.y * speed;
    }
    koi.x = Math.min(FIELD.width - koi.radius, Math.max(koi.radius, koi.x + koi.vx * dt));
    koi.y = Math.min(FIELD.height - koi.radius, Math.max(210, koi.y + koi.vy * dt));
    if (Math.hypot(koi.vx, koi.vy) > 20) koi.angle = Math.atan2(koi.vy, koi.vx);
    koi.swim += dt * (6 + Math.hypot(koi.vx, koi.vy) / 60);
    if (koi.invulnerable > 0) koi.invulnerable = Math.max(0, koi.invulnerable - dt);

    // --- spawning (drift downward, like the river flowing past) ---
    const ws = waveSpeed();
    state.pearlTimer -= dt;
    if (state.pearlTimer <= 0) {
      spawn(KIND_PEARL, 60 + random() * (FIELD.width - 120), -30, PEARL.radius, PEARL.speed * ws);
      state.pearlTimer = 0.85 - state.wave * 0.1 + random() * 0.5;
    }
    state.rockTimer -= dt;
    if (state.rockTimer <= 0) {
      const kind = random() < 0.22 && state.wave >= 2 ? KIND_WHIRL : KIND_ROCK;
      const r = kind === KIND_WHIRL ? WHIRL.radius : ROCK.radius;
      spawn(kind, 60 + random() * (FIELD.width - 120), -40, r, (kind === KIND_WHIRL ? WHIRL.speed : ROCK.speed + ROCK.speedPerWave * (state.wave - 1)) * ws);
      state.rockTimer = Math.max(0.55, 1.35 - state.wave * 0.18) + random() * 0.6;
    }
    state.lotusTimer -= dt;
    if (state.lotusTimer <= 0) {
      spawn(KIND_LOTUS, 80 + random() * (FIELD.width - 160), -30, LOTUS.radius, LOTUS.speed);
      state.lotusTimer = 7 + random() * 5;
    }
    state.scaleTimer -= dt;
    if (state.scaleTimer <= 0) {
      spawn(KIND_SCALE, 80 + random() * (FIELD.width - 160), -30, SCALE.radius, SCALE.speed);
      state.scaleTimer = 12 + random() * 6;
    }
    state.heronTimer -= dt;
    if (state.heronTimer <= 0 && state.wave >= 2) {
      spawn(KIND_HERON, random() < 0.5 ? -40 : FIELD.width + 40, 130 + random() * 120, HERON.radius, HERON.speed * ws);
      state.heronTimer = 13 + random() * 7;
    }

    // --- items ---
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      item.phase += dt * 3;
      item.bob = Math.sin(item.phase) * 6;
      if (item.kind === KIND_HERON) {
        if (item.vx === 0) item.vx = item.x < FIELD.width / 2 ? 1 : -1;
        item.x += item.vx * item.speed * dt;
        item.y += Math.sin(item.phase * 0.7) * 18 * dt;
      } else {
        item.y += item.speed * dt;
        // Whirlpools tug the koi toward them.
        if (item.kind === KIND_WHIRL && !harmless) {
          const dx = item.x - koi.x;
          const dy = item.y - koi.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < 220) {
            koi.x += (dx / d) * WHIRL.pull * dt * (1 - d / 220);
            koi.y += (dy / d) * WHIRL.pull * dt * (1 - d / 220);
          }
        }
      }
      if (item.y > FIELD.height + 60 || item.x < -80 || item.x > FIELD.width + 80) {
        if (item.kind === KIND_HERON) { item.active = false; continue; }
        if (item.y > FIELD.height + 60) item.active = false;
        continue;
      }
      if (harmless) continue;
      const hitR = item.radius * 0.82;
      if (!circleHit(koi.x, koi.y, koi.radius * 0.85, item.x, item.y + item.bob, hitR)) continue;
      if (item.kind === KIND_PEARL) {
        item.active = false;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        const gained = PEARL.points + Math.min(state.combo - 1, 10);
        state.score += gained;
        burst(item.x, item.y, '#ffe066', 8, 160);
        events |= EVENT_PEARL;
      } else if (item.kind === KIND_LOTUS) {
        item.active = false;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.score += LOTUS.points;
        burst(item.x, item.y, '#ff8fb3', 12, 190);
        events |= EVENT_LOTUS;
      } else if (item.kind === KIND_SCALE) {
        item.active = false;
        state.score += SCALE.points;
        state.dashReady = true;
        burst(item.x, item.y, '#f4b942', 14, 220);
        events |= EVENT_SCALE;
      } else if (koi.invulnerable === 0) {
        item.active = false;
        state.lives -= 1;
        state.combo = 0;
        koi.invulnerable = KOI.invulnerable;
        burst(koi.x, koi.y, '#ffffff', 16, 260);
        events |= EVENT_HIT;
        if (state.lives === 0) {
          events |= EVENT_OVER;
          break;
        }
      }
    }

    // --- particles ---
    for (let index = 0; index < particles.length; index += 1) {
      const p = particles[index];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
    }

    if (!harmless && state.score >= WIN_SCORE) events |= EVENT_WIN;
    return events;
  }

  reset();
  return { state, reset, step, burst };
}
