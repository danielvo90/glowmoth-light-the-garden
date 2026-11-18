// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the real
// rules forward from a fresh world, steered by a simple autopilot (head for the
// nearest orb, or for a lantern when carrying glow; keep clear of wisps), so the
// frame is what a short game really looks like and the same seed always gives the
// same frame. The win scene plays until every lantern is lit; the end scene's
// pilot is careless, so the wisps catch it as a hurried player would be caught.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const WIN_LIMIT_SECONDS = 600;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** Steer toward (tx, ty) while keeping `clear` away from every active wisp. */
function steerTo(state, tx, ty, clear) {
  const player = state.player;
  let dx = tx - player.x;
  let dy = ty - player.y;
  for (const wisp of state.wisps) {
    if (!wisp.active) continue;
    const wx = player.x - wisp.x;
    const wy = player.y - wisp.y;
    const d = Math.hypot(wx, wy);
    if (d < clear && d > 1) {
      const push = (clear - d) / clear * 2.2;
      dx += (wx / d) * push;
      dy += (wy / d) * push;
    }
  }
  const d = Math.hypot(dx, dy);
  if (d < 1) return { x: 0, y: 0, dash: false };
  return { x: dx / d, y: dy / d, dash: false };
}

function autopilot(state, careful) {
  const player = state.player;
  const clear = careful ? 130 : 70;
  if (state.glow >= 2) {
    let lantern = null;
    for (const item of state.lanterns) {
      if (!item.lit && (lantern === null || Math.hypot(item.x - player.x, item.y - player.y) < Math.hypot(lantern.x - player.x, lantern.y - player.y))) lantern = item;
    }
    if (lantern !== null) return steerTo(state, lantern.x, lantern.y, clear);
  }
  let orb = null;
  for (const item of state.orbs) {
    if (item.active && (orb === null || Math.hypot(item.x - player.x, item.y - player.y) < Math.hypot(orb.x - player.x, orb.y - player.y))) orb = item;
  }
  if (orb !== null) return steerTo(state, orb.x, orb.y, clear);
  return steerTo(state, FIELD.width / 2, FIELD.height / 2, clear);
}

/**
 * Set `world` to the named scene (start, play, win or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { x: 0, y: 0, dash: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    for (let i = 0; i < WIN_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world.state, true), false);
      if (events & EVENT_WIN) break;
    }
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const careful = name !== 'end';
  for (let i = 0; i < limit / STEP; i += 1) {
    if (world.step(STEP, autopilot(world.state, careful), false) & EVENT_OVER) break;
  }
  const over = world.state.lives === 0 || world.state.timeLeft <= 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
