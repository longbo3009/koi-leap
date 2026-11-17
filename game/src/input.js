// Keyboard and pointer input for Koi Leap. Held keys give a 2-D steering vector;
// the mouse sets a target point the koi swims toward. One-shot presses (start,
// restart, pause, mute, dash) are queued as bit flags and taken once by the loop,
// so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_DASH = 8;
export const ACTION_RESTART = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const DASH = new Set(['ShiftLeft', 'ShiftRight']);
const RESTART = new Set(['KeyR']);

export function createInput(target, onPointer) {
  const held = { up: false, down: false, left: false, right: false };
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (MUTE.has(event.code)) { if (!event.repeat) actions |= ACTION_MUTE; }
    else if (DASH.has(event.code)) { if (!event.repeat) actions |= ACTION_DASH; }
    else if (RESTART.has(event.code)) { if (!event.repeat) actions |= ACTION_RESTART; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    held.up = false; held.down = false; held.left = false; held.right = false;
  });
  target.addEventListener('pointerdown', (event) => {
    actions |= ACTION_CONFIRM;
    onPointer(event.clientX, event.clientY);
  });
  target.addEventListener('pointermove', (event) => {
    if (event.buttons > 0) onPointer(event.clientX, event.clientY);
  });

  return {
    /** Steering vector, each component -1, 0 or 1, normalised by the caller. */
    vector() {
      return { x: (held.right ? 1 : 0) - (held.left ? 1 : 0), y: (held.down ? 1 : 0) - (held.up ? 1 : 0) };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
