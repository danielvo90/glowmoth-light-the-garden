// Glowmoth — Light the Garden. Every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The night lasts this long; light every lantern before it ends. */
export const NIGHT_SECONDS = 90;

export const PLAYER = {
  radius: 14,
  speed: 330,
  dashSpeed: 720,
  dashTime: 0.18,
  dashCooldown: 1.1,
  invulnerable: 1.5,
};

export const LIVES = 3;

/** Five lanterns to light, one per corner and one in the middle. */
export const LANTERN_SPOTS = [
  { x: 150, y: 170 },
  { x: 1130, y: 170 },
  { x: 640, y: 130 },
  { x: 240, y: 540 },
  { x: 1040, y: 540 },
];

export const ORB = {
  radius: 11,
  points: 10,
  interval: 0.85,
  intervalJitter: 0.5,
  drift: 26,
};

export const WISP = {
  radius: 17,
  speed: 105,
  speedPerLantern: 16,
  interval: 2.4,
  intervalScale: 0.86,
  minInterval: 1.0,
};

export const BLOSSOM = {
  radius: 13,
  interval: 17,
};

export const COMBO = {
  window: 4,
  perTier: 4,
  maxMultiplier: 3,
};

export const LANTERN_POINTS = 50;
/** Glow an unlit lantern needs before it lights. */
export const LANTERN_GLOW_NEEDED = 2;
export const WIN_TIME_BONUS_PER_SECOND = 5;

/** How many things can exist at once; pools are allocated once, at boot. */
export const POOL_SIZE = 96;

export const PALETTE = {
  nightTop: '#0b1030',
  nightBottom: '#123527',
  star: '#dfe8ff',
  grass: '#173d2b',
  grassTip: '#2c6b45',
  flower: '#e58fb1',
  mothBody: '#ffd98a',
  mothWing: '#ffe9b8',
  mothGlow: '#ffcf5c',
  orb: '#ffd94d',
  orbCore: '#fff6c8',
  wisp: '#7a5cff',
  wispEye: '#f4efff',
  lanternPost: '#5a4632',
  lanternGlass: '#8a93a8',
  lanternLit: '#ffb347',
  lanternGlow: '#ff9d2e',
  blossom: '#ff8fb8',
  panel: '#101a33',
  panelEdge: '#2e4a7a',
  text: '#f2f0ff',
  muted: '#9aa3c7',
  danger: '#ff6b6b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'glowmoth.best';
