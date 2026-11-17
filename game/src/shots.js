// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot that swims toward the nearest pearl or lotus and away from
// rocks, whirlpools and herons, so the frame is what a real game looks like and
// the same seed always gives the same frame. The win scene steers well and
// collects until it reaches the Dragon Gate; the end scene steers badly, so it
// is caught out as a hurried player is.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN, KIND_HERON, KIND_ROCK, KIND_WHIRL } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const WIN_LIMIT_SECONDS = 600;
const END_LIMIT_SECONDS = 600;

function nearest(state, kinds) {
  let best = null;
  let bestD = Infinity;
  for (let index = 0; index < state.items.length; index += 1) {
    const item = state.items[index];
    if (!item.active || !kinds.includes(item.kind)) continue;
    const d = Math.hypot(item.x - state.koi.x, item.y - state.koi.y);
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}

function dangerNear(state, range) {
  let pushX = 0;
  let pushY = 0;
  for (let index = 0; index < state.items.length; index += 1) {
    const item = state.items[index];
    if (!item.active) continue;
    if (item.kind !== KIND_ROCK && item.kind !== KIND_WHIRL && item.kind !== KIND_HERON) continue;
    const dx = state.koi.x - item.x;
    const dy = state.koi.y - item.y;
    const d = Math.hypot(dx, dy);
    if (d < range && d > 1) {
      const w = (range - d) / range;
      pushX += (dx / d) * w;
      pushY += (dy / d) * w;
    }
  }
  return { x: pushX, y: pushY };
}

/** A steering vector: toward the target, pushed away from danger, normalised. */
function autopilot(state, careful) {
  const target = nearest(state, [0, 1, 2]) || { x: FIELD.width / 2, y: state.koi.y - 120 };
  let vx = target.x - state.koi.x;
  let vy = target.y - state.koi.y;
  const len = Math.hypot(vx, vy) || 1;
  vx /= len; vy /= len;
  if (careful) {
    const push = dangerNear(state, 170);
    vx += push.x * 1.6;
    vy += push.y * 1.6;
  }
  const n = Math.hypot(vx, vy) || 1;
  return { x: vx / n, y: vy / n };
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show. 'win' plays until the Dragon Gate; 'end' until game over.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { x: 0, y: -0.3 }, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'play' ? PLAY_SECONDS : (name === 'win' ? WIN_LIMIT_SECONDS : END_LIMIT_SECONDS);
  const careful = name !== 'end';
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state, careful), false, false);
    if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: world.state.score };
    if (events & EVENT_OVER) break;
  }
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
