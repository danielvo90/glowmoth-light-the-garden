# Glowmoth — Light the Garden

An original 2D arcade game for make.fun's "Make the best game" bounty
(best-game-01). Built with plain Canvas 2D, no libraries, no network requests:
every file the game loads lives under `game/`.

## How to play

You are a glowmoth on the last night of summer. The garden has gone dark.

- **Goal:** light all **5 lanterns** before the 90-second night ends.
- **Gather glow:** fly into golden light orbs. Each orb is +10 points (combo
  multiplier up to x3 for quick chains) and +1 glow.
- **Light a lantern:** each unlit lantern needs **2 glow**. Touch it while
  carrying at least 2 glow and it lights (+50 points).
- **Dodge the shadow wisps:** they hunt you. One touch costs a life (3 lives).
  A dash makes you briefly untouchable; a pink shield blossom absorbs one hit.
- **Win:** light all 5 lanterns — remaining night time is added as a bonus.
  **Lose:** lose all 3 lives, or the night runs out first.

## Controls

- Move: **Arrow keys / WASD**, or hold the **mouse** — the moth steers toward it.
- **Dash:** Shift (or J) — a fast burst, brief invulnerability, short cooldown.
- **Pause:** P or Esc. **Start / restart:** Space, Enter, or click.

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.
- `game/index.html` — the page; `game/src/` is the game, one job per file:
  `config.js` (tuning), `random.js` (seeded RNG), `world.js` (rules/state),
  `input.js` (keyboard + mouse), `audio.js` (synthesized Web Audio sounds),
  `render.js` (all drawing, HUD and screens), `shots.js` (screenshot scenes),
  `main.js` (boot, fixed-step loop, screens).
- `screenshots/` — 1-start, 2-play, 3-win, 4-end, real renders of the game.
- `serve.ts` — local static server: `node serve.ts`, then open
  http://localhost:8080.

## License

MIT — see `LICENSE`.
