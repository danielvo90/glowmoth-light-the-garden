// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the
// backdrop colour. Canvas gradients and glow for the night garden, the lanterns and
// the moth; canvas text for the HUD and the panels.
import { FIELD, FONT, LIVES, PALETTE } from './config.js';
import { KIND_BLOSSOM, KIND_ORB, KIND_WISP } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const PANEL = { width: 660, top: 118, line: 32, bottom: 72 };
const HEART_SIZE = 20;

function makeStars() {
  const stars = [];
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i += 1) {
    stars.push({ x: next() * FIELD.width, y: next() * 300, r: 0.6 + next() * 1.4, tw: next() * Math.PI * 2 });
  }
  return stars;
}

function makeGrass() {
  const blades = [];
  let seed = 987654;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 130; i += 1) {
    blades.push({ x: next() * FIELD.width, h: 14 + next() * 26, lean: (next() - 0.5) * 14 });
  }
  return blades;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0, ratio: 1 };
  const stars = makeStars();
  const grass = makeGrass();
  const fonts = new Map();
  let time = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
    view.ratio = ratio;
  }
  window.addEventListener('resize', resize);
  resize();

  function text(value, x, y, size, color, align, weight) {
    if (!fonts.has(size + (weight || ''))) {
      fonts.set(size + (weight || ''), `${weight || ''} ${size}px ${FONT}`);
    }
    context.font = fonts.get(size + (weight || ''));
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.fillText(value, x, y);
  }

  function glowCircle(x, y, radius, color, alpha) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  function drawGarden(state) {
    const sky = context.createLinearGradient(0, 0, 0, FIELD.height);
    sky.addColorStop(0, PALETTE.nightTop);
    sky.addColorStop(1, PALETTE.nightBottom);
    context.fillStyle = sky;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    time += 1 / 60;
    for (const star of stars) {
      const alpha = 0.35 + 0.35 * Math.sin(time * 1.5 + star.tw);
      context.globalAlpha = alpha;
      context.fillStyle = PALETTE.star;
      context.beginPath();
      context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    // Moon.
    glowCircle(1120, 84, 70, '#e8ecff', 0.5);
    context.fillStyle = '#f4f6ff';
    context.beginPath();
    context.arc(1120, 84, 30, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d9dff2';
    context.beginPath();
    context.arc(1110, 76, 7, 0, Math.PI * 2);
    context.arc(1130, 94, 5, 0, Math.PI * 2);
    context.fill();
    // Grass.
    context.fillStyle = PALETTE.grass;
    context.fillRect(0, FIELD.height - 56, FIELD.width, 56);
    for (const blade of grass) {
      context.strokeStyle = PALETTE.grassTip;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(blade.x, FIELD.height - 56);
      context.lineTo(blade.x + blade.lean, FIELD.height - 56 - blade.h);
      context.stroke();
    }
  }

  function drawLantern(lantern) {
    const { x, y } = lantern;
    context.fillStyle = PALETTE.lanternPost;
    context.fillRect(x - 4, y - 6, 8, 62);
    context.fillRect(x - 14, y + 56, 28, 6);
    if (lantern.lit) {
      glowCircle(x, y - 22, 74, PALETTE.lanternGlow, 0.85);
      context.fillStyle = PALETTE.lanternLit;
    } else {
      context.fillStyle = PALETTE.lanternGlass;
    }
    context.beginPath();
    context.arc(x, y - 22, 15, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#3a2c1e';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y - 22, 15, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#3a2c1e';
    context.fillRect(x - 17, y - 40, 34, 5);
  }

  function drawMoth(player) {
    const { x, y } = player;
    const blink = player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0;
    glowCircle(x, y, 46, PALETTE.mothGlow, 0.55);
    if (blink) return;
    const flap = Math.sin(player.wingPhase) * 0.55;
    context.fillStyle = PALETTE.mothWing;
    context.save();
    context.translate(x, y);
    context.rotate(-0.5 - flap * 0.4);
    context.beginPath();
    context.ellipse(-12, -8, 15, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.rotate(1 + flap * 0.8);
    context.beginPath();
    context.ellipse(12, -8, 15, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.fillStyle = PALETTE.mothBody;
    context.beginPath();
    context.ellipse(x, y, 9, 13, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.mothBody;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x - 3, y - 12);
    context.quadraticCurveTo(x - 8, y - 22, x - 12, y - 24);
    context.moveTo(x + 3, y - 12);
    context.quadraticCurveTo(x + 8, y - 22, x + 12, y - 24);
    context.stroke();
    if (player.shield) {
      context.strokeStyle = PALETTE.blossom;
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(x, y, 26, 0, Math.PI * 2);
      context.stroke();
    }
    if (player.dashCooldown > 0 && player.dashTime <= 0) {
      context.strokeStyle = 'rgba(255,217,92,0.45)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - player.dashCooldown / 1.1));
      context.stroke();
    }
  }

  function drawField(state) {
    drawGarden(state);
    for (const lantern of state.lanterns) drawLantern(lantern);
    for (const item of state.orbs) {
      if (!item.active) continue;
      const pulse = 1 + 0.18 * Math.sin(item.phase);
      glowCircle(item.x, item.y, 30 * pulse, PALETTE.orb, 0.7);
      context.fillStyle = PALETTE.orbCore;
      context.beginPath();
      context.arc(item.x, item.y, item.radius * 0.62 * pulse, 0, Math.PI * 2);
      context.fill();
    }
    for (const item of state.blossoms) {
      if (!item.active) continue;
      const pulse = 1 + 0.15 * Math.sin(item.phase);
      glowCircle(item.x, item.y, 30 * pulse, PALETTE.blossom, 0.5);
      context.fillStyle = PALETTE.blossom;
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = (petal / 5) * Math.PI * 2 + item.phase * 0.2;
        context.beginPath();
        context.arc(item.x + Math.cos(angle) * 8, item.y + Math.sin(angle) * 8, 6, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = '#fff0a8';
      context.beginPath();
      context.arc(item.x, item.y, 4.5, 0, Math.PI * 2);
      context.fill();
    }
    for (const item of state.wisps) {
      if (!item.active) continue;
      glowCircle(item.x, item.y, 44, PALETTE.wisp, 0.45);
      context.fillStyle = PALETTE.wisp;
      context.beginPath();
      context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(item.x - item.radius * 0.7, item.y + item.radius * 0.4);
      context.quadraticCurveTo(item.x, item.y + item.radius * 1.5, item.x + item.radius * 0.7, item.y + item.radius * 0.4);
      context.closePath();
      context.fill();
      context.fillStyle = PALETTE.wispEye;
      context.beginPath();
      context.arc(item.x - 6, item.y - 3, 3.4, 0, Math.PI * 2);
      context.arc(item.x + 6, item.y - 3, 3.4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#1c1440';
      context.beginPath();
      context.arc(item.x - 6, item.y - 3, 1.6, 0, Math.PI * 2);
      context.arc(item.x + 6, item.y - 3, 1.6, 0, Math.PI * 2);
      context.fill();
    }
    for (const p of state.particles) {
      if (!p.active) continue;
      context.globalAlpha = Math.max(0, p.life / p.maxLife);
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    drawMoth(state.player);
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text(`Score ${state.score}`, 24, 18, 26, PALETTE.text, 'left', '700 ');
    const lanternText = `Lanterns ${state.lanternsLit}/5`;
    text(lanternText, 24, 52, 22, state.lanternsLit === 5 ? PALETTE.lanternLit : PALETTE.muted, 'left', '600 ');
    text(`Glow ${state.glow}`, 24, 82, 22, PALETTE.orb, 'left', '600 ');
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
    const timeColor = state.timeLeft <= 15 ? PALETTE.danger : PALETTE.text;
    text(`Night ${minutes}:${seconds}`, FIELD.width / 2, 18, 26, timeColor, 'center', '700 ');
    if (state.multiplier > 1) {
      text(`Combo x${state.multiplier.toFixed(1)}`, FIELD.width / 2, 52, 22, PALETTE.orb, 'center', '700 ');
    }
    text('Lives', FIELD.width - 24 - LIVES * (HEART_SIZE + 8) - 70, 18, 26, PALETTE.text, 'right', '600 ');
    for (let life = 0; life < LIVES; life += 1) {
      const cx = FIELD.width - 24 - (LIVES - 1 - life) * (HEART_SIZE + 8);
      const cy = 30;
      context.fillStyle = life < state.lives ? '#ff6b81' : '#3a3f55';
      context.beginPath();
      context.arc(cx - 5, cy, 6, 0, Math.PI * 2);
      context.arc(cx + 5, cy, 6, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(cx - 11, cy + 2);
      context.lineTo(cx, cy + 12);
      context.lineTo(cx + 11, cy + 2);
      context.closePath();
      context.fill();
    }
    if (state.player.shield) text('Shield ready', FIELD.width - 24, 52, 20, PALETTE.blossom, 'right', '600 ');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(6,10,26,0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 62, 44, accent || PALETTE.text, 'center', '800 ');
    lines.forEach((line, i) => {
      text(line.text, FIELD.width / 2, y + 112 + i * PANEL.line, line.size || 21, line.color || PALETTE.text, 'center', line.weight || '');
    });
    text(prompt, FIELD.width / 2, y + height - 26, 22, PALETTE.muted, 'center', '600 ');
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.nightTop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('GLOWMOTH', [
        { text: 'Light the Garden', size: 26, color: PALETTE.lanternLit, weight: '700 ' },
        { text: 'You are a glowmoth on the last night of summer.', size: 21 },
        { text: 'Gather light orbs — each lantern needs 2 glow to light.', size: 21 },
        { text: 'Light all 5 lanterns before the night ends. Dodge the wisps!', size: 21 },
        { text: 'Move: arrows / WASD / hold mouse  •  Dash: Shift  •  Pause: P', size: 19, color: PALETTE.muted },
        { text: `Best score ${best}`, size: 20, color: PALETTE.orb, weight: '600 ' },
      ], 'Press Space or click to start');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', [
        { text: `Score ${state.score}  •  Lanterns ${state.lanternsLit}/5`, size: 22 },
        { text: 'The garden waits for you.', size: 21, color: PALETTE.muted },
      ], 'Press P or Space to keep playing');
    } else if (screen === SCREEN_WIN) {
      drawPanel('GARDEN LIT!', [
        { text: 'Every lantern glows. The night is yours.', size: 23, color: PALETTE.lanternLit, weight: '700 ' },
        { text: `Score ${state.score}`, size: 26, weight: '700 ' },
        { text: `Lanterns 5/5  •  Lives left ${state.lives}  •  Best ${best}`, size: 21 },
        { text: 'Time bonus is already in your score.', size: 19, color: PALETTE.muted },
      ], 'Press Space or click to play again', PALETTE.lanternLit);
    } else if (screen === SCREEN_OVER) {
      const reason = state.timeLeft <= 0 ? 'The night ended before the garden was lit.' : 'The wisps caught the glowmoth.';
      drawPanel('THE NIGHT WINS', [
        { text: reason, size: 22, color: PALETTE.danger, weight: '600 ' },
        { text: `Score ${state.score}  •  Lanterns ${state.lanternsLit}/5`, size: 24, weight: '700 ' },
        { text: `Best ${best}`, size: 21, color: PALETTE.orb, weight: '600 ' },
      ], 'Press Space or click to try again', PALETTE.danger);
    }
  }

  return { draw, view };
}
