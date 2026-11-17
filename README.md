# Koi Leap — 錦鯉躍龍門

An original arcade game for the make.fun best-game-01 bounty. A koi swims up a
sunset river: collect glowing pearls (+10, combo bonus) and lotus flowers (+25),
grab golden scales (+50 and a dash refill), and dodge rocks, whirlpools (they
pull you in) and herons. You have 3 lives. Reach **1000 points** to leap the
Dragon Gate and win; lose all 3 lives and the river wins.

## How to play

- **Move:** WASD / arrow keys, or hold the mouse button and steer toward the pointer
- **Dash:** Shift (2.5 s cooldown; golden scales refill it instantly)
- **Pause:** P or Esc
- **Mute:** M
- **Start / restart:** Space, Enter, click, or R on the end screens

Waves get faster and busier: wave 2 adds whirlpools and herons, wave 3 is the
Dragon Gate wave. Your best score is saved in the browser (localStorage).

## How to run it

No build step, no network — all art is drawn in code and all sounds are
WebAudio.

```sh
node serve.ts
# then open http://localhost:8080 in desktop Chrome
```

Or serve `game/` with any static HTTP server and open `game/index.html`.

Screenshot scenes (used for the entry's screenshots) are staged with a query
string, e.g. `?shot=play&seed=1` — see `shots.json`.

## Files

- `game/index.html` — the page
- `game/src/config.js` — tuning numbers and palette
- `game/src/world.js` — rules: koi, spawning, collisions, score, waves
- `game/src/render.js` — all procedural canvas art and the HUD
- `game/src/input.js` — keyboard + mouse input
- `game/src/audio.js` — WebAudio chimes, splashes and win arpeggio
- `game/src/shots.js` — autopilot that stages the screenshot scenes
- `game/src/main.js` — boot, game loop, screens
- `main.ts` — hands game/ + screenshots/ in and writes dossier.json
- `screenshots/` — 4 real renders of the game in a browser
