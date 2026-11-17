// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with deep river colour. All art is procedural canvas drawing — sunset sky,
// teal river with drifting ripples, a pagoda and the Dragon Gate on the far bank,
// a pink-and-gold koi with a flowing tail, glowing pearls, lotus, rocks,
// whirlpools and herons. Canvas text for the HUD and the panels.

import { FIELD, FONT, LIVES, PALETTE, WIN_SCORE } from './config.js';
import { KIND_HERON, KIND_LOTUS, KIND_PEARL, KIND_ROCK, KIND_SCALE, KIND_WHIRL } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 680, top: 150, line: 32, bottom: 76 };

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) { value = next; text = prefix + next; }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const waveLabel = cachedLabel('Wave ');
  const comboLabel = cachedLabel('Combo x');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight = '600') {
    const key = `${weight}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight} ${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawSky(state) {
    const g = context.createLinearGradient(0, 0, 0, 190);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.6, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyLow);
    context.fillStyle = g;
    context.fillRect(0, 0, FIELD.width, 190);
    // Sun, low over the far bank.
    const sg = context.createRadialGradient(1040, 118, 8, 1040, 118, 90);
    sg.addColorStop(0, PALETTE.sun);
    sg.addColorStop(1, 'rgba(255, 243, 176, 0)');
    context.fillStyle = sg;
    context.beginPath(); context.arc(1040, 118, 90, 0, Math.PI * 2); context.fill();
    context.fillStyle = PALETTE.sun;
    context.beginPath(); context.arc(1040, 118, 42, 0, Math.PI * 2); context.fill();
    // Drifting clouds.
    context.fillStyle = 'rgba(255, 253, 245, 0.85)';
    for (let i = 0; i < 3; i += 1) {
      const cx = ((i * 430 + state.scroll * (12 + i * 6)) % 1500) - 110;
      const cy = 52 + i * 38;
      context.beginPath();
      context.ellipse(cx, cy, 74, 17, 0, 0, Math.PI * 2);
      context.ellipse(cx + 44, cy + 6, 52, 13, 0, 0, Math.PI * 2);
      context.fill();
    }
    // Far bank: pagoda and Dragon Gate silhouettes.
    context.fillStyle = '#7a4a2b';
    drawPagoda(150, 190, 0.9);
    context.fillStyle = '#8a5a30';
    drawPagoda(1150, 190, 0.62);
    drawGate(640, 190);
  }

  function drawPagoda(x, baseY, s) {
    context.save();
    context.translate(x, baseY);
    context.scale(s, s);
    context.fillRect(-34, -78, 68, 78);
    for (let i = 0; i < 3; i += 1) {
      const y = -78 - i * 26;
      context.beginPath();
      context.moveTo(-52, y + 10); context.lineTo(0, y - 14); context.lineTo(52, y + 10);
      context.lineTo(40, y + 14); context.lineTo(-40, y + 14); context.closePath(); context.fill();
    }
    context.restore();
  }

  function drawGate(x, baseY) {
    context.save();
    context.translate(x, baseY);
    context.fillStyle = PALETTE.gateRed;
    context.fillRect(-88, -118, 16, 118);
    context.fillRect(72, -118, 16, 118);
    context.fillStyle = PALETTE.gateGold;
    context.fillRect(-104, -132, 208, 16);
    context.fillRect(-92, -104, 184, 10);
    context.beginPath(); context.arc(0, -108, 13, 0, Math.PI * 2); context.fill();
    context.fillStyle = PALETTE.gateRed;
    context.beginPath(); context.arc(0, -108, 8, 0, Math.PI * 2); context.fill();
    context.restore();
    text('龍門', x, baseY - 146, 26, PALETTE.gateGold, 'center', '800');
  }

  function drawRiver(state) {
    const g = context.createLinearGradient(0, 190, 0, FIELD.height);
    g.addColorStop(0, PALETTE.riverTop);
    g.addColorStop(0.55, PALETTE.riverMid);
    g.addColorStop(1, PALETTE.riverDeep);
    context.fillStyle = g;
    context.fillRect(0, 190, FIELD.width, FIELD.height - 190);
    // Sun glitter on the water, kept close to the sun so it reads as sparkle.
    context.fillStyle = 'rgba(255, 243, 176, 0.28)';
    for (let i = 0; i < 8; i += 1) {
      const y = 210 + ((i * 53 + state.scroll * 30) % 300);
      const w = 40 + (i % 3) * 22;
      context.fillRect(1000 - w / 2 + Math.sin(i * 2.1) * 40, y, w, 3);
    }
    // Drifting ripple rings.
    context.strokeStyle = 'rgba(127, 227, 208, 0.5)';
    context.lineWidth = 2;
    for (let i = 0; i < 8; i += 1) {
      const y = 220 + ((i * 67 + state.scroll * 46) % 500);
      const x = (i * 173) % FIELD.width;
      context.beginPath();
      context.ellipse(x, y, 46 + (i % 3) * 14, 9, 0, 0, Math.PI * 2);
      context.stroke();
    }
    // Reeds at the banks.
    context.strokeStyle = '#2e8b57';
    context.lineWidth = 4;
    for (let i = 0; i < 10; i += 1) {
      const x = 18 + i * 14;
      const h = 34 + (i % 3) * 14;
      context.beginPath(); context.moveTo(x, FIELD.height); context.lineTo(x + 8, FIELD.height - h); context.stroke();
      const x2 = FIELD.width - 18 - i * 14;
      context.beginPath(); context.moveTo(x2, FIELD.height); context.lineTo(x2 - 8, FIELD.height - h); context.stroke();
    }
  }

  function drawKoi(koi, t) {
    context.save();
    context.translate(koi.x, koi.y);
    context.rotate(koi.angle + Math.PI / 2);
    const wag = Math.sin(koi.swim) * 0.22;
    // Flowing tail.
    context.fillStyle = PALETTE.koiTail;
    context.beginPath();
    context.moveTo(-8, 16);
    context.quadraticCurveTo(-26 - wag * 30, 34, -14 - wag * 40, 52);
    context.quadraticCurveTo(0, 40, 14 + wag * 40, 52);
    context.quadraticCurveTo(26 + wag * 30, 34, 8, 16);
    context.closePath(); context.fill();
    // Body.
    const bg = context.createLinearGradient(0, -30, 0, 24);
    bg.addColorStop(0, PALETTE.koiBody);
    bg.addColorStop(1, PALETTE.koiBelly);
    context.fillStyle = bg;
    context.beginPath(); context.ellipse(0, 0, 24, 32, 0, 0, Math.PI * 2); context.fill();
    // White patches and a gold stripe.
    context.fillStyle = 'rgba(255, 253, 245, 0.9)';
    context.beginPath(); context.ellipse(-8, -12, 9, 12, 0.4, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(10, 8, 7, 10, -0.3, 0, Math.PI * 2); context.fill();
    context.fillStyle = PALETTE.gateGold;
    context.beginPath(); context.ellipse(0, -4, 4, 18, 0, 0, Math.PI * 2); context.fill();
    // Fins.
    context.fillStyle = 'rgba(255, 93, 143, 0.85)';
    context.beginPath(); context.ellipse(-24, 2, 10, 5, -0.7, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(24, 2, 10, 5, 0.7, 0, Math.PI * 2); context.fill();
    // Eye.
    context.fillStyle = '#1b2a2e';
    context.beginPath(); context.arc(-7, -20, 3.4, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(7, -20, 3.4, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#ffffff';
    context.beginPath(); context.arc(-6, -21, 1.2, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(8, -21, 1.2, 0, Math.PI * 2); context.fill();
    context.restore();
    // Dash ring.
    if (koi.dash > 0) {
      context.strokeStyle = 'rgba(244, 185, 66, 0.9)';
      context.lineWidth = 3;
      context.beginPath(); context.arc(koi.x, koi.y, koi.radius + 12, 0, Math.PI * 2); context.stroke();
    }
  }

  function drawItem(item) {
    const y = item.y + item.bob;
    if (item.kind === KIND_PEARL) {
      const g = context.createRadialGradient(item.x, y, 2, item.x, y, 26);
      g.addColorStop(0, 'rgba(255, 224, 102, 0.9)');
      g.addColorStop(1, 'rgba(255, 224, 102, 0)');
      context.fillStyle = g;
      context.beginPath(); context.arc(item.x, y, 26, 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.pearl;
      context.beginPath(); context.arc(item.x, y, item.radius, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#ffffff';
      context.beginPath(); context.arc(item.x - 4, y - 5, 4, 0, Math.PI * 2); context.fill();
    } else if (item.kind === KIND_LOTUS) {
      context.fillStyle = PALETTE.lotusLeaf;
      context.beginPath(); context.ellipse(item.x, y + 10, 30, 10, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.lotus;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        context.beginPath();
        context.ellipse(item.x + Math.cos(a) * 11, y + Math.sin(a) * 9, 11, 6, a, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = PALETTE.pearlGlow;
      context.beginPath(); context.arc(item.x, y, 6, 0, Math.PI * 2); context.fill();
    } else if (item.kind === KIND_SCALE) {
      context.save();
      context.translate(item.x, y);
      context.rotate(Math.sin(item.phase) * 0.5);
      context.fillStyle = PALETTE.gateGold;
      context.beginPath(); context.ellipse(0, 0, 12, 17, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = '#fff3b0';
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(0, -12); context.lineTo(0, 12); context.stroke();
      context.restore();
      text('DASH', item.x, y + 34, 13, PALETTE.gateGold, 'center', '800');
    } else if (item.kind === KIND_ROCK) {
      context.fillStyle = PALETTE.rock;
      context.beginPath();
      context.moveTo(item.x - item.radius, y + 8);
      context.lineTo(item.x - item.radius * 0.6, y - item.radius * 0.9);
      context.lineTo(item.x + item.radius * 0.5, y - item.radius);
      context.lineTo(item.x + item.radius, y + 4);
      context.lineTo(item.x + item.radius * 0.6, y + item.radius * 0.8);
      context.lineTo(item.x - item.radius * 0.5, y + item.radius * 0.7);
      context.closePath(); context.fill();
      context.fillStyle = 'rgba(255, 253, 245, 0.35)';
      context.beginPath(); context.ellipse(item.x - 8, y - 12, 12, 6, -0.5, 0, Math.PI * 2); context.fill();
    } else if (item.kind === KIND_WHIRL) {
      context.strokeStyle = 'rgba(255, 253, 245, 0.9)';
      context.lineWidth = 4;
      for (let r = 8; r <= item.radius; r += 9) {
        context.beginPath();
        context.arc(item.x, y, r, item.phase + r, item.phase + r + Math.PI * 1.4);
        context.stroke();
      }
      context.fillStyle = '#0b4b5a';
      context.beginPath(); context.arc(item.x, y, 7, 0, Math.PI * 2); context.fill();
    } else if (item.kind === KIND_HERON) {
      const flap = Math.sin(item.phase * 6) * 0.5;
      context.fillStyle = PALETTE.heron;
      context.beginPath(); context.ellipse(item.x, y, 30, 13, 0, 0, Math.PI * 2); context.fill();
      context.save();
      context.translate(item.x + 22, y - 4);
      context.rotate(-0.5);
      context.fillRect(0, -3, 22, 6);
      context.beginPath(); context.arc(24, -2, 6, 0, Math.PI * 2); context.fill();
      context.restore();
      context.fillStyle = '#f4b942';
      context.beginPath(); context.moveTo(item.x + 44, y - 8); context.lineTo(item.x + 58, y - 5); context.lineTo(item.x + 44, y - 2); context.closePath(); context.fill();
      context.fillStyle = PALETTE.heron;
      context.beginPath(); context.ellipse(item.x - 6, y - 12 - flap * 14, 22, 6, -0.6 - flap * 0.3, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(item.x - 6, y + 12 + flap * 14, 22, 6, 0.6 + flap * 0.3, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#1b2a2e';
      context.beginPath(); context.arc(item.x + 44, y - 8, 2, 0, Math.PI * 2); context.fill();
    }
  }

  function drawField(state) {
    drawSky(state);
    drawRiver(state);
    for (let index = 0; index < state.items.length; index += 1) {
      const item = state.items[index];
      if (item.active) drawItem(item);
    }
    for (let index = 0; index < state.particles.length; index += 1) {
      const p = state.particles[index];
      if (!p.active) continue;
      context.globalAlpha = Math.max(0, p.life / p.max);
      context.fillStyle = p.color;
      context.beginPath(); context.arc(p.x, p.y, p.size, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    const koi = state.koi;
    if (koi.invulnerable === 0 || Math.floor(koi.invulnerable * 10) % 2 === 1) drawKoi(koi, state.elapsed);
  }

  function drawHud(state, muted) {
    context.textBaseline = 'top';
    roundRect(14, 12, 250, 46, 12);
    context.fillStyle = PALETTE.panel; context.fill();
    text(scoreLabel(state.score), 30, 24, 26, PALETTE.text, 'left');
    roundRect(280, 12, 150, 46, 12);
    context.fillStyle = PALETTE.panel; context.fill();
    text(waveLabel(state.wave), 300, 24, 26, PALETTE.text, 'left');
    // Lives as hearts.
    roundRect(FIELD.width - 250, 12, 236, 46, 12);
    context.fillStyle = PALETTE.panel; context.fill();
    for (let life = 0; life < LIVES; life += 1) {
      const cx = FIELD.width - 216 + life * 34;
      const cy = 35;
      context.fillStyle = life < state.lives ? '#ff5d8f' : 'rgba(255, 253, 245, 0.25)';
      context.beginPath();
      context.moveTo(cx, cy + 8);
      context.bezierCurveTo(cx - 12, cy - 4, cx - 6, cy - 12, cx, cy - 4);
      context.bezierCurveTo(cx + 6, cy - 12, cx + 12, cy - 4, cx, cy + 8);
      context.fill();
    }
    // Combo, bottom-left over the dark river so it never collides with the pagoda.
    if (state.combo >= 2) {
      text(comboLabel(state.combo), 30, 650, 26, PALETTE.pearlGlow, 'left', '800');
    }
    // Progress to the Dragon Gate, along the bottom so it never crosses the gate.
    const progress = Math.min(1, state.score / WIN_SCORE);
    context.fillStyle = 'rgba(8, 42, 54, 0.55)';
    roundRect(440, 688, 400, 14, 7); context.fill();
    context.fillStyle = PALETTE.gateGold;
    roundRect(440, 688, 400 * progress, 14, 7); context.fill();
    text(`Dragon Gate ${state.score} / ${WIN_SCORE}`, 640, 668, 16, PALETTE.text, 'center');
    // Hint line on its own dark chip, readable against the sky.
    roundRect(FIELD.width - 336, 62, 322, 26, 8);
    context.fillStyle = PALETTE.panel; context.fill();
    text(muted ? 'M: sound off' : 'M: sound on   P: pause   Shift: dash', FIELD.width - 24, 68, 15, PALETTE.muted, 'right');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, PANEL.width, height, 18); context.fill();
    context.strokeStyle = PALETTE.gateGold;
    context.lineWidth = 3;
    roundRect(x, y, PANEL.width, height, 18); context.stroke();
    context.textBaseline = 'alphabetic';
    // Shrink a long title until it fits the panel instead of spilling over it.
    let titleSize = 46;
    context.font = `800 ${titleSize}px ${FONT}`;
    while (titleSize > 28 && context.measureText(title).width > PANEL.width - 48) {
      titleSize -= 2;
      context.font = `800 ${titleSize}px ${FONT}`;
    }
    text(title, FIELD.width / 2, y + 74, titleSize, PALETTE.text, 'center', '800');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 23, PALETTE.pearlGlow, 'center', '700');
  }

  const TITLE_LINES = [
    'Swim up the river, collect pearls and lotus,',
    'dodge rocks, whirlpools and herons.',
    'Reach 1000 points and leap the Dragon Gate!',
    'Move: WASD / arrows or mouse · Dash: Shift',
    'Golden scales refill your dash. 3 lives.',
    '',
  ];
  const PAUSED_LINES = ['The river will wait for you.'];
  const OVER_LINES = ['', '', ''];
  const WIN_LINES = ['', '', ''];

  /** Paint one frame: the river, then the HUD or a panel for the screen. */
  function draw(state, screen, best, muted = false) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.riverDeep;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[5] = bestLabel(best);
      drawPanel('Koi Leap  錦鯉躍龍門', TITLE_LINES, 'Press Space or click to start');
      return;
    }
    drawHud(state, muted);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = `Best combo x${state.bestCombo}   Wave ${state.wave}`;
      OVER_LINES[2] = bestLabel(best);
      drawPanel('The river wins this time', OVER_LINES, 'Press Space or R to swim again');
    } else if (screen === SCREEN_WIN) {
      WIN_LINES[0] = finalLabel(state.score);
      WIN_LINES[1] = `Best combo x${state.bestCombo}   Wave ${state.wave}`;
      WIN_LINES[2] = bestLabel(best);
      drawPanel('You leapt the Dragon Gate!  躍龍門', WIN_LINES, 'Press Space or R to swim again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
