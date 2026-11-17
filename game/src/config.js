// Koi Leap — tuning numbers and palette in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const WIN_SCORE = 1000;

export const KOI = {
  radius: 26,
  speed: 420,
  dashSpeed: 950,
  dashTime: 0.28,
  invulnerable: 1.6,
};

export const LIVES = 3;

export const PEARL = { radius: 13, points: 10, speed: 120 };
export const LOTUS = { radius: 22, points: 25, speed: 90 };
export const SCALE = { radius: 15, points: 50, speed: 110 };
export const ROCK = { radius: 26, speed: 150, speedPerWave: 26 };
export const WHIRL = { radius: 34, speed: 110, pull: 260 };
export const HERON = { radius: 30, speed: 210 };

/** Seconds of play per wave; wave 3 is the last, the Dragon Gate wave. */
export const WAVE = { seconds: 22, max: 3 };

export const POOL_SIZE = 72;

export const PALETTE = {
  skyTop: '#ff9e5e',
  skyMid: '#ffd9a0',
  skyLow: '#ffeecf',
  sun: '#fff3b0',
  riverTop: '#2ec4b6',
  riverMid: '#1899a2',
  riverDeep: '#0b6b7a',
  riverEdge: '#7fe3d0',
  koiBody: '#ff7a59',
  koiBelly: '#ffd166',
  koiTail: '#ff5d8f',
  pearl: '#fff8d6',
  pearlGlow: '#ffe066',
  lotus: '#ff8fb3',
  lotusLeaf: '#3fae6a',
  rock: '#6b7c8d',
  heron: '#f4f7f9',
  gateRed: '#d62828',
  gateGold: '#f4b942',
  panel: 'rgba(8, 42, 54, 0.72)',
  text: '#fffdf5',
  muted: '#cfeee8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'koi-leap.best';
