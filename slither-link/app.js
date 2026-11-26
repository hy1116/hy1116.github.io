/* 슬리더 링크 웹 버전 — 화면 · 입력 · 게임 흐름 · 통계 */
'use strict';

const EMPTY = 0, LINE = 1, CROSS = 2;
const SIZES = [5, 7, 10, 12];
const DIFFS = Object.keys(DIFFICULTY);
const REVEAL_DELAY = 600;           // 정답 보기 잠금(초)
const CELL = 100, MARGIN = 40;      // SVG 좌표 단위
const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/* ───────── 저장소 (브라우저 localStorage) ───────── */
const K_PREFS = 'slither.prefs.v1', K_STATS = 'slither.stats.v1', K_GAME = 'slither.game.v1';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가: 무시 */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } },
};
const fmt = (sec) => {
  const s = Math.max(0, Math.floor(sec)), p = (x) => String(x).padStart(2, '0');
  if (s >= 3600) return `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  return `${p(Math.floor(s / 60))}:${p(s % 60)}`;
};
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/* ───────── 날짜 (오늘의 퍼즐은 한국 시간 기준) ───────── */
const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const addDays = (date, n) => new Date(Date.parse(date + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const weekday = (date) => new Date(date + 'T00:00:00Z').getUTCDay();          // 0=일 … 6=토
const dayLabel = (date) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
const shortDay = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const DAILY_SEED = 'slither-daily-v1:';      // 바꾸면 모든 날짜의 퍼즐이 바뀜
const dailyConfig = (date) => ([0, 6].includes(weekday(date)) ? { n: 10, diff: '보통' } : { n: 7, diff: '보통' });

/* ───────── 통계 (데스크톱 버전과 같은 형식) ───────── */
class Stats {
  constructor() {
    const d = store.get(K_STATS, {});
    this.games = Array.isArray(d.games) ? d.games.filter((g) => g && typeof g === 'object') : [];
  }
  save() { store.set(K_STATS, { version: 1, games: this.games }); }
  add(size, diff, secs, result, undo, extra = {}) {
    const n = new Date(), p = (x) => String(x).padStart(2, '0');
    const g = {
      date: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`,
      size, diff, time: Math.floor(secs), result, undo,
    };
    for (const k in extra) if (extra[k]) g[k] = extra[k];      // hints, daily (있을 때만)
    this.games.push(g);
    this.save();
  }
  clear() { this.games = []; this.save(); }
  summary(size = null, diff = null) {
    const gs = this.games.filter((g) => (size === null || g.size === size) && (diff === null || g.diff === diff));
    const won = gs.filter((g) => g.result === Stats.WIN);
    const clean = won.filter((g) => !g.hints).map((g) => g.time || 0);   // 힌트 쓴 판은 기록 제외
    return {
      played: gs.length, won: won.length,
      rate: gs.length ? won.length / gs.length : null,
      best: clean.length ? Math.min(...clean) : null,
      avg: clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null,
    };
  }
  best(size, diff) { return this.summary(size, diff).best; }
  streaks() {
    let cur = 0, best = 0;
    for (const g of this.games) {
      if (g.result === Stats.WIN) { cur++; best = Math.max(best, cur); } else cur = 0;
    }
    return [cur, best];
  }
  recent(n = 10) { return this.games.slice(-n).reverse(); }
  dailyWin(date) { return this.games.find((g) => g.daily === date && g.result === Stats.WIN) || null; }
  dailyStreaks(today) {                    // [지금 연속, 최고 연속, 총 완료 일수]
    const days = new Set(this.games.filter((g) => g.daily && g.result === Stats.WIN).map((g) => g.daily));
    let cur = 0, d = days.has(today) ? today : addDays(today, -1);
    while (days.has(d)) { cur++; d = addDays(d, -1); }
    let best = 0, run = 0, prev = null;
    for (const x of [...days].sort()) {
      run = prev && addDays(prev, 1) === x ? run + 1 : 1;
      best = Math.max(best, run); prev = x;
    }
    return [cur, best, days.size];
  }
}
Stats.WIN = '완성'; Stats.REVEAL = '정답 보기'; Stats.QUIT = '포기';

/* ───────── 게임 상태 ───────── */
const prefs = store.get(K_PREFS, {});
const G = {
  size: SIZES.includes(prefs.size) ? prefs.size : 7,
  diff: DIFFS.includes(prefs.diff) ? prefs.diff : '보통',
  grid: null, clues: null, solution: null, state: [],
  undo: [], redo: [],
  solved: false, won: false, revealed: false, overlayHidden: false, generating: false,
  acc: 0, since: null,                // 시계: 누적 ms + 진행 중 구간 시작 시각
  undoCount: 0, newBest: false, prevBest: null,
  mode: LINE, hover: -1, genId: 0, statsTab: 0,
  challenge: null,                  // 공유받은 기록 { time } — 이기면 비교
  daily: null,                      // 오늘의 퍼즐이면 날짜 'YYYY-MM-DD'
  practice: false,                  // 이미 완료한 오늘의 퍼즐 다시 풀기 (기록 안 남김)
  hints: 0, hl: null,               // 힌트 사용 횟수 / 보드 강조 표시
};
const stats = new Stats();

function savePrefs() {
  store.set(K_PREFS, { size: G.size, diff: G.diff, theme: document.documentElement.dataset.theme || null });
}

/* ───────── 시계 (앱이 백그라운드로 가면 멈춤) ───────── */
const running = () => !!G.grid && !G.solved && !G.generating;
const elapsed = () => (G.acc + (G.since !== null ? Date.now() - G.since : 0)) / 1000;
function pauseClock() { if (G.since !== null) { G.acc += Date.now() - G.since; G.since = null; } }
function resumeClock() { if (G.since === null && running() && !document.hidden) G.since = Date.now(); }
const revealReady = () => elapsed() >= REVEAL_DELAY;

/* ───────── 진행 중인 게임 저장/복원 (사파리가 페이지를 다시 불러와도 이어서) ───────── */
function saveGame() {
  if (!running()) { store.del(K_GAME); return; }
  store.set(K_GAME, {
    size: G.size, diff: G.diff, clues: G.clues, solution: G.solution, state: G.state,
    elapsed: elapsed(), undoCount: G.undoCount, challenge: G.challenge,
    daily: G.daily, practice: G.practice, hints: G.hints,
  });
}
function restoreGame() {
  const s = store.get(K_GAME, null);
  if (!s || !SIZES.includes(s.size) || !DIFFS.includes(s.diff)) return false;
  const ne = new Grid(s.size, s.size).ne;
  if (!Array.isArray(s.clues) || s.clues.length !== s.size * s.size) return false;
  if (!Array.isArray(s.state) || s.state.length !== ne || !Array.isArray(s.solution) || s.solution.length !== ne) return false;
  G.size = s.size; G.diff = s.diff;
  loadPuzzle({ R: s.size, C: s.size, clues: s.clues, solution: s.solution }, s.state,
    (s.elapsed || 0) * 1000, s.undoCount || 0, {
      challenge: s.challenge && Number.isFinite(s.challenge.time) ? { time: s.challenge.time } : null,
      daily: typeof s.daily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.daily) ? s.daily : null,
      practice: !!s.practice, hints: Number(s.hints) || 0,
    });
  return true;
}

/* ───────── 퍼즐 생성 (Web Worker) ───────── */
let worker = null, jobSeq = 0;
const jobs = new Map();
function syncJob(msg) {               // 워커를 못 쓸 때 (예: 파일로 직접 열었을 때)
  if (msg.type === 'solve') {
    const s = new Solver(new Grid(msg.n, msg.n), msg.clues, 300000);
    const sols = s.solve(2);
    return { count: s.aborted ? -1 : sols.length, solution: sols[0] || null };
  }
  return { puzzle: generatePuzzle(msg.n, msg.n, msg.diff, msg.seed ? seedRandom(msg.seed) : Math.random) };
}
function runJob(msg) {
  return new Promise((resolve) => {
    if (!worker) { setTimeout(() => resolve(syncJob(msg)), 30); return; }
    const id = ++jobSeq;
    jobs.set(id, { msg, resolve });
    worker.postMessage({ ...msg, id });
  });
}
try {
  worker = new Worker('worker.js');
  worker.onmessage = (ev) => {
    const job = jobs.get(ev.data.id);
    if (job) { jobs.delete(ev.data.id); job.resolve(ev.data); }
  };
  worker.onerror = () => {             // 워커가 죽으면 남은 일을 직접 처리
    worker = null;
    for (const [id, job] of jobs) { jobs.delete(id); job.resolve(syncJob(job.msg)); }
  };
} catch (e) { worker = null; }

/* opts: { seed, daily, practice, challenge } — 오늘의 퍼즐은 날짜 시드로 만든다 */
function newGame(opts = {}) {
  if (G.generating) return;
  G.generating = true;
  G.grid = null; G.state = []; G.undo = []; G.redo = [];
  G.solved = G.won = G.revealed = G.overlayHidden = false;
  G.acc = 0; G.since = null; G.hover = -1; G.undoCount = 0;
  G.challenge = null; G.daily = opts.daily || null; G.practice = false; G.hints = 0; G.hl = null;
  store.del(K_GAME);
  $('board').textContent = '';
  render();
  const id = ++G.genId;
  runJob({ type: 'gen', n: G.size, diff: G.diff, seed: opts.seed }).then((r) => {
    if (id === G.genId) loadPuzzle(r.puzzle, null, 0, 0, opts);
  });
}

function loadPuzzle(p, state = null, accMs = 0, undoCount = 0, meta = {}) {
  G.challenge = meta.challenge || null;
  G.daily = meta.daily || null;
  G.practice = !!meta.practice;
  G.hints = meta.hints || 0;
  G.hl = null;
  G.grid = new Grid(p.R, p.C);
  G.clues = p.clues; G.solution = p.solution;
  G.state = state ? state.slice() : new Array(G.grid.ne).fill(EMPTY);
  G.undo = []; G.redo = [];
  G.solved = G.won = G.revealed = G.overlayHidden = false;
  G.generating = false;
  G.acc = accMs; G.since = null; G.undoCount = undoCount;
  G.newBest = false; G.prevBest = null; G.hover = -1;
  buildBoard();
  resumeClock();
  render();
  saveGame();
}

/* ───────── 보드 (SVG) ───────── */
const svg = $('board');
let edgeEls = [], crossEls = [], clueEls = [], dotEls = [], hlCell = null, hlVert = null;

function mk(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent.appendChild(el);
  return el;
}

function buildBoard() {
  const g = G.grid, C = g.C, R = g.R;
  Z.full = { x: -MARGIN, y: -MARGIN, w: C * CELL + 2 * MARGIN, h: R * CELL + 2 * MARGIN };
  cancelAnimationFrame(Z.anim);
  applyView(Z.full.x, Z.full.y, Z.full.w);
  svg.textContent = '';
  const gHl = mk('g', {}, svg), gClue = mk('g', {}, svg), gEdge = mk('g', {}, svg), gDot = mk('g', {}, svg);
  hlCell = mk('rect', { class: 'hl-cell', width: CELL - 12, height: CELL - 12, rx: 16 }, gHl);
  hlVert = mk('circle', { class: 'hl-vert', r: 24 }, gDot);
  clueEls = G.clues.map((k, cell) => {
    if (k === null) return null;
    const t = mk('text', { class: 'clue', x: (cell % C + 0.5) * CELL, y: (Math.floor(cell / C) + 0.5) * CELL }, gClue);
    t.textContent = k;
    return t;
  });
  edgeEls = []; crossEls = [];
  for (let e = 0; e < g.ne; e++) {
    const [a, b] = g.edgeVerts[e];
    const x1 = (a % (C + 1)) * CELL, y1 = Math.floor(a / (C + 1)) * CELL;
    const x2 = (b % (C + 1)) * CELL, y2 = Math.floor(b / (C + 1)) * CELL;
    edgeEls.push(mk('line', { class: 'e', x1, y1, x2, y2 }, gEdge));
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, s = 8;
    crossEls.push(mk('path', { class: 'x', d: `M${mx - s} ${my - s}L${mx + s} ${my + s}M${mx - s} ${my + s}L${mx + s} ${my - s}` }, gEdge));
  }
  dotEls = [];
  for (let v = 0; v < g.nvert; v++) {
    dotEls.push(mk('circle', { class: 'dot', cx: (v % (C + 1)) * CELL, cy: Math.floor(v / (C + 1)) * CELL, r: 5.5 }, gDot));
  }
  svg.classList.add('fresh');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('fresh')));
}

/* ───────── 확대 · 이동 (viewBox 를 바꿔서 판의 일부만 보여 준다) ─────────
 * 터치: 두 손가락 벌리기/모으기로 확대, 두 손가락(또는 확대 뒤 남은 한 손가락)으로 이동
 * 마우스: 휠로 확대, 가운데 버튼 드래그로 이동 · 키보드 + / - / 0 */
const Z = { full: null, view: null, anim: 0 };
const maxZoom = () => (G.grid ? Math.max(2, G.grid.C / 2.5) : 1);     // 5×5: 2배, 7×7: 2.8배, 10×10: 4배
const zoomLevel = () => (Z.full && Z.view ? Z.full.w / Z.view.w : 1);
const clampW = (w) => Math.min(Z.full.w, Math.max(Z.full.w / maxZoom(), w));

function applyView(x, y, w) {        // 판 밖으로 나가지 않게 맞춘 뒤 적용
  const f = Z.full, h = w * f.h / f.w;
  x = Math.min(f.x + f.w - w, Math.max(f.x, x));
  y = Math.min(f.y + f.h - h, Math.max(f.y, y));
  Z.view = { x, y, w, h };
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  const z = zoomLevel();
  $('zoom-reset').classList.toggle('on', z >= 1.02);
  $('zoom-reset').disabled = $('zoom-out').disabled = z < 1.02;
  $('zoom-in').disabled = z > maxZoom() - 0.02;
  $('zoom-label').textContent = `${z.toFixed(1)}×`;
}
/* 화면 좌표 (cx, cy) 아래의 판 위치를 그대로 둔 채 factor 배 확대 */
function zoomAt(cx, cy, factor) {
  if (!Z.view) return;
  cancelAnimationFrame(Z.anim);
  const r = svg.getBoundingClientRect(), v = Z.view;
  const fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
  const w = clampW(v.w / factor), h = w * v.h / v.w;
  applyView(v.x + fx * v.w - fx * w, v.y + fy * v.h - fy * h, w);
}
function zoomCenter(factor) {
  const r = svg.getBoundingClientRect();
  zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
}
function resetZoom() {
  if (!Z.full || zoomLevel() < 1.001) return;
  cancelAnimationFrame(Z.anim);
  const from = { ...Z.view }, to = Z.full, t0 = performance.now(), ms = 240;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { applyView(to.x, to.y, to.w); return; }
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3;
    applyView(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e, from.w + (to.w - from.w) * e);
    if (k < 1) Z.anim = requestAnimationFrame(step);
  };
  Z.anim = requestAnimationFrame(step);
}

/* 손가락(또는 가운데 버튼) 여러 개를 추적해서 확대/이동. 손가락 수가 바뀔 때마다 기준을 다시 잡는다 */
const ptrs = new Map();     // pointerId → { x, y }
let pinch = null;           // { px, py, w, d } — 기준 시점의 판 위치 · 폭 · 손가락 간격
function ptrCenter() {
  const ps = [...ptrs.values()], n = ps.length;
  const c = { x: ps.reduce((a, p) => a + p.x, 0) / n, y: ps.reduce((a, p) => a + p.y, 0) / n };
  c.d = n > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0;
  return c;
}
function pinchBase() {
  cancelAnimationFrame(Z.anim);
  const c = ptrCenter(), r = svg.getBoundingClientRect(), v = Z.view;
  pinch = { px: v.x + (c.x - r.left) / r.width * v.w, py: v.y + (c.y - r.top) / r.height * v.h, w: v.w, d: c.d };
}
function pinchMove() {
  const c = ptrCenter(), r = svg.getBoundingClientRect();
  const w = clampW(pinch.d && c.d ? pinch.w * pinch.d / c.d : pinch.w), h = w * Z.full.h / Z.full.w;
  applyView(pinch.px - (c.x - r.left) / r.width * w, pinch.py - (c.y - r.top) / r.height * h, w);
}

function renderBoard() {
  const g = G.grid;
  svg.classList.toggle('won', G.won);
  svg.classList.toggle('revealed', G.revealed);
  if (!g) return;
  for (let e = 0; e < g.ne; e++) {
    const s = G.state[e];
    edgeEls[e].classList.toggle('on', s === LINE);
    edgeEls[e].classList.toggle('hover', s === EMPTY && e === G.hover);
    crossEls[e].classList.toggle('on', s === CROSS);
    edgeEls[e].classList.toggle('hl', !!G.hl && !G.hl.wrong && G.hl.e === e);
    edgeEls[e].classList.toggle('wrong', !!(G.hl && G.hl.wrong && G.hl.e === e));   // undefined 면 toggle 이 뒤집기로 동작하므로 반드시 boolean
  }
  const hc = G.hl && G.hl.cell !== undefined ? G.hl.cell : -1;
  hlCell.classList.toggle('on', hc >= 0);
  if (hc >= 0) { hlCell.setAttribute('x', (hc % g.C) * CELL + 6); hlCell.setAttribute('y', Math.floor(hc / g.C) * CELL + 6); }
  const hv = G.hl && G.hl.vert !== undefined ? G.hl.vert : -1;
  hlVert.classList.toggle('on', hv >= 0);
  if (hv >= 0) { hlVert.setAttribute('cx', (hv % (g.C + 1)) * CELL); hlVert.setAttribute('cy', Math.floor(hv / (g.C + 1)) * CELL); }
  G.clues.forEach((k, cell) => {
    if (k === null) return;
    let n = 0;
    for (const e of g.cellEdges[cell]) if (G.state[e] === LINE) n++;
    clueEls[cell].classList.toggle('done', n === k);
    clueEls[cell].classList.toggle('over', n > k);
  });
  for (let v = 0; v < g.nvert; v++) dotEls[v].classList.toggle('hide', g.vertEdges[v].some((e) => G.state[e] === LINE));
}

/* ───────── 전체 화면 갱신 ───────── */
function setOn(el, sel) { [...el.children].forEach((b, i) => b.classList.toggle('on', i === sel)); }

function render() {
  setOn($('seg-size'), SIZES.indexOf(G.size));
  setOn($('seg-diff'), DIFFS.indexOf(G.diff));
  setOn($('seg-mode'), G.mode === LINE ? 0 : 1);
  $('btn-new').disabled = G.generating;
  renderDailyButton();

  const playing = running();
  $('t-undo').disabled = !(playing && G.undo.length);
  $('t-redo').disabled = !(playing && G.redo.length);
  $('t-cross').disabled = !playing;
  $('t-hint').disabled = !playing;
  $('t-reset').disabled = !(playing && G.state.some((s) => s));
  renderReveal();

  const st = $('status');
  st.classList.toggle('win-text', G.won);
  st.classList.toggle('challenge', (!!G.challenge || !!G.daily) && playing);
  if (G.generating) st.textContent = '퍼즐을 만드는 중…';
  else if (G.won) st.textContent = `완성!  기록 ${fmt(elapsed())}`;
  else if (G.revealed) st.textContent = '정답을 공개했어요 · 새 게임으로 다시 도전해 보세요';
  else if (G.challenge) st.textContent = `⚑ 친구 기록 ${fmt(G.challenge.time)}에 도전 중!`;
  else if (G.daily) st.textContent = `📅 ${dayLabel(G.daily)} 오늘의 퍼즐${G.practice ? ' (연습 · 기록 안 남음)' : ''}`;
  else st.textContent = isTouch() ? '탭: 선   ·   길게 누르기: X 표시'
    : '';

  $('spinner').hidden = !G.generating;
  const showWin = G.won && !G.overlayHidden;
  $('win').hidden = !showWin;
  if (showWin) {
    const what = G.daily ? `${dayLabel(G.daily)} 오늘의 퍼즐` : `${G.size}×${G.size} · ${G.diff}`;
    $('win-meta').textContent = `${what} · 기록 ${fmt(elapsed())}${G.hints ? ` · 힌트 ${G.hints}회` : ''}`;
    const b = $('win-best');
    let best, isNew = false;
    if (G.practice) best = '연습이라 기록은 남지 않아요';
    else if (G.daily) { best = `🔥 오늘의 퍼즐 ${stats.dailyStreaks(kstToday())[0]}일 연속 완료!`; isNew = true; }
    else if (G.newBest) { best = '★  최고 기록 달성!'; isNew = true; }
    else if (G.hints) best = G.prevBest === null ? '힌트를 쓴 판은 최고 기록에서 빠져요' : `최고 기록 ${fmt(G.prevBest)} · 힌트 쓴 판은 제외`;
    else best = `최고 기록 ${fmt(G.prevBest)}`;
    b.classList.toggle('new', isNew);
    b.textContent = best;
    const ch = $('win-challenge');
    ch.hidden = !G.challenge;
    if (G.challenge) {
      const mine = Math.floor(elapsed()), theirs = G.challenge.time;
      ch.classList.toggle('lose', mine > theirs);
      ch.textContent = mine < theirs ? `⚑ 친구 기록 ${fmt(theirs)}보다 ${fmt(theirs - mine)} 빨랐어요!`
        : mine === theirs ? `⚑ 친구 기록 ${fmt(theirs)}와 동점!`
          : `친구 기록 ${fmt(theirs)}보다 ${fmt(mine - theirs)} 늦었어요`;
    }
  }
  $('btn-share').disabled = !G.grid || G.generating;
  $('timer').textContent = fmt(elapsed());
  renderBoard();
}

function renderReveal() {
  const playing = running(), ready = revealReady();
  $('t-reveal').disabled = !(playing && ready);
  let label = '정답 보기';
  if (playing && !ready) {
    const left = Math.ceil(REVEAL_DELAY - elapsed());
    label = `정답 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  $('reveal-label').textContent = label;
}

let shownDay = kstToday();
setInterval(() => {
  $('timer').textContent = fmt(elapsed());
  if (running()) renderReveal();
  if (kstToday() !== shownDay) { shownDay = kstToday(); renderDailyButton(); }   // 자정이 지나면
}, 250);

function renderDailyButton() {
  const today = kstToday(), done = stats.dailyWin(today), btn = $('btn-daily');
  const now = G.daily === today && !G.practice && (running() || G.generating);
  btn.classList.toggle('on', now);
  btn.classList.toggle('done', !!done && !now);
  $('daily-label').textContent = done ? `오늘 ✓ ${fmt(done.time)}` : '오늘의 퍼즐';
  btn.disabled = G.generating;
}

/* ───────── 편집 · 되돌리기 ───────── */
function applyBatch(batch) {
  for (const [e, , n] of batch) G.state[e] = n;
  G.undo.push(batch); G.redo = [];
  afterChange();
}
function afterChange() { checkWin(); saveGame(); render(); }

function undo() {
  if (!running() || !G.undo.length) return;
  const batch = G.undo.pop();
  G.undoCount++;
  for (const [e, o] of batch) G.state[e] = o;
  G.redo.push(batch);
  saveGame(); render();
}
function redo() {
  if (!running() || !G.redo.length) return;
  const batch = G.redo.pop();
  for (const [e, , n] of batch) G.state[e] = n;
  G.undo.push(batch);
  afterChange();
}
function resetBoard() {
  if (!running()) return;
  const batch = [];
  G.state.forEach((s, e) => { if (s !== EMPTY) batch.push([e, s, EMPTY]); });
  if (batch.length) applyBatch(batch);
}
function autoCross() {
  if (!running()) return;
  const g = G.grid, targets = new Set();
  G.clues.forEach((k, cell) => {
    if (k === null) return;
    if (g.cellEdges[cell].filter((e) => G.state[e] === LINE).length === k)
      g.cellEdges[cell].forEach((e) => { if (G.state[e] === EMPTY) targets.add(e); });
  });
  for (let v = 0; v < g.nvert; v++) {
    if (g.vertEdges[v].filter((e) => G.state[e] === LINE).length === 2)
      g.vertEdges[v].forEach((e) => { if (G.state[e] === EMPTY) targets.add(e); });
  }
  if (targets.size) applyBatch([...targets].map((e) => [e, EMPTY, CROSS]));
}
function recordResult(result, secs) {
  if (G.practice) return;
  stats.add(G.size, G.diff, secs, result, G.undoCount, { hints: G.hints, daily: G.daily });
}
const recordQuit = () => recordResult(Stats.QUIT, elapsed());

function showSolution() {
  if (!running() || !revealReady()) return;
  pauseClock();
  G.state = G.solution.map((s) => (s ? LINE : EMPTY));
  G.solved = G.revealed = true;
  G.hl = null;
  recordResult(Stats.REVEAL, elapsed());
  store.del(K_GAME);
  resetZoom();
  render();
}

/* ───────── 완성 판정 ───────── */
function checkWin() {
  const g = G.grid;
  for (let cell = 0; cell < G.clues.length; cell++) {
    const k = G.clues[cell];
    if (k !== null && g.cellEdges[cell].filter((e) => G.state[e] === LINE).length !== k) return;
  }
  const lines = G.state.map((s) => (s === LINE ? 1 : -1));
  if (!lines.includes(1)) return;
  for (let v = 0; v < g.nvert; v++) {
    const n = g.vertEdges[v].filter((e) => lines[e] === 1).length;
    if (n !== 0 && n !== 2) return;
  }
  if (new Solver(g, G.clues).loopStatus(lines) !== 'closed') return;
  pauseClock();
  G.solved = G.won = true; G.hover = -1;
  const t = Math.floor(elapsed());
  G.prevBest = stats.best(G.size, G.diff);
  G.newBest = !G.hints && !G.practice && (G.prevBest === null || t < G.prevBest);
  G.hl = null;
  recordResult(Stats.WIN, t);
  store.del(K_GAME);
  resetZoom();                     // 완성된 고리 전체가 보이게
}

/* ───────── 힌트 ─────────
 * 1) 잘못된 표시가 있으면 그것부터 지운다
 * 2) 지금 상태에서 바로 확정되는 선 (칸 숫자 / 점의 연결)
 * 3) 주변을 따져 보면(전파) 확정되는 선
 * 4) 그래도 없으면 정답에서 선 하나 (끊긴 선 끝 근처 우선) */
function findHint() {
  const g = G.grid, sol = G.solution, st = G.state;
  for (let e = 0; e < g.ne; e++) {
    if (st[e] === LINE && !sol[e]) return { e, wrong: true, msg: '이 선은 정답에 없어서 지웠어요' };
    if (st[e] === CROSS && sol[e]) return { e, wrong: true, msg: '여기엔 선이 들어가야 해서 X를 지웠어요' };
  }
  const cur = st.map((s) => (s === LINE ? 1 : s === CROSS ? 0 : -1));
  const ok = (e) => sol[e] === 1;          // 안전장치: 정답과 다른 힌트는 절대 주지 않음
  for (let cell = 0; cell < G.clues.length; cell++) {
    const k = G.clues[cell];
    if (k === null) continue;
    const es = g.cellEdges[cell], unk = es.filter((e) => cur[e] === -1);
    const on = es.filter((e) => cur[e] === 1).length;
    if (unk.length && on < k && on + unk.length === k && ok(unk[0]))
      return { e: unk[0], cell, msg: `이 ${k} 칸은 남은 변이 모두 선이어야 개수가 맞아요` };
  }
  const deg = (v) => g.vertEdges[v].filter((e) => cur[e] === 1).length;
  for (let v = 0; v < g.nvert; v++) {
    const unk = g.vertEdges[v].filter((e) => cur[e] === -1);
    if (deg(v) === 1 && unk.length === 1 && ok(unk[0]))
      return { e: unk[0], vert: v, msg: '선이 끊기지 않으려면 여기로 이어져야 해요' };
  }
  const looseEnd = (e) => g.edgeVerts[e].some((v) => deg(v) === 1);
  const pick = (cands) => cands.find(looseEnd) ?? cands[0];
  const closed = cur.slice();
  new Solver(g, G.clues).propagate(closed, Array.from({ length: g.ne }, (_, i) => i));
  const deduced = [];
  for (let e = 0; e < g.ne; e++) if (cur[e] === -1 && closed[e] === 1 && ok(e)) deduced.push(e);
  if (deduced.length) return { e: pick(deduced), msg: '주변 숫자와 선을 따져 보면 여기는 선이 들어가야 해요' };
  const rest = [];
  for (let e = 0; e < g.ne; e++) if (cur[e] === -1 && sol[e]) rest.push(e);
  if (rest.length) return { e: pick(rest), msg: '어려운 자리라서 정답에서 한 칸 알려 드려요' };
  return null;
}

let hlTimer = null;
function useHint() {
  if (!running()) return;
  const h = findHint();
  if (!h) return;
  G.hints++;
  applyBatch([[h.e, G.state[h.e], h.wrong ? EMPTY : LINE]]);
  if (!G.won) {
    G.hl = h;
    renderBoard();
    clearTimeout(hlTimer);
    hlTimer = setTimeout(() => { G.hl = null; renderBoard(); }, 2600);
  }
  toast(`💡 ${h.msg}`, 3400);
}

/* ───────── 오늘의 퍼즐 ───────── */
function startDaily(practice = false, challenge = null) {
  const date = kstToday(), cfg = dailyConfig(date);
  G.size = cfg.n; G.diff = cfg.diff;            // 일반 게임 설정(prefs)은 그대로 둠
  newGame({ seed: DAILY_SEED + date, daily: date, practice, challenge });
}
function requestDaily(challenge = null) {
  if (G.generating) return;
  const date = kstToday();
  if (G.daily === date && running() && !challenge) { toast('지금 오늘의 퍼즐을 풀고 있어요'); return; }
  const done = stats.dailyWin(date), quit = hasProgress();
  const go = (practice) => { if (quit) recordQuit(); startDaily(practice, challenge); };
  const quitMsg = quit ? ' 지금 풀던 퍼즐은 \'포기\'로 기록돼요.' : '';
  if (done) {
    openConfirm({
      title: '오늘의 퍼즐 다시 풀기', icon: '📅', ok: '다시 풀기',
      msg: `오늘은 이미 ${fmt(done.time)}에 완료했어요. 다시 풀면 기록은 남지 않아요.${quitMsg}`,
      action: () => go(true),
    });
  } else if (quit) {
    openConfirm({ title: '오늘의 퍼즐을 시작할까요?', icon: '📅', ok: '시작', msg: quitMsg.trim(), action: () => go(false) });
  } else go(false);
}

/* ───────── 입력: 마우스 · 터치 ───────── */
let drag = null;      // { target, batch: Map }
let pending = null;   // 터치: 탭인지 길게 누르기인지 판단 중 { e, id, timer }

function edgeAt(ev, touch) {
  if (!G.grid || G.generating) return -1;
  const m = svg.getScreenCTM();
  if (!m) return -1;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const p = pt.matrixTransform(m.inverse());
  const gx = p.x / CELL, gy = p.y / CELL, R = G.grid.R, C = G.grid.C;
  let best = -1, bd = touch ? 0.45 : 0.38;
  let r = Math.round(gy), c = Math.floor(gx);
  if (r >= 0 && r <= R && c >= 0 && c < C && Math.abs(gy - r) < bd) { best = G.grid.h(r, c); bd = Math.abs(gy - r); }
  r = Math.floor(gy); c = Math.round(gx);
  if (r >= 0 && r < R && c >= 0 && c <= C && Math.abs(gx - c) < bd) best = G.grid.v(r, c);
  return best;
}
function setHover(e) { if (e !== G.hover) { G.hover = e; renderBoard(); } }

function startDrag(e, kind) {
  drag = { target: G.state[e] === kind ? EMPTY : kind, batch: new Map() };
  dragSet(e);
}
function dragSet(e) {
  if (e < 0 || !drag || drag.batch.has(e) || G.state[e] === drag.target) return;
  drag.batch.set(e, [G.state[e], drag.target]);
  G.state[e] = drag.target;
  renderBoard();
}
function commitDrag() {
  if (drag && drag.batch.size) {
    G.undo.push([...drag.batch].map(([e, [o, n]]) => [e, o, n]));
    G.redo = [];
    afterChange();
  }
  drag = null;
}

/* 두 번째 손가락이 닿으면 그리던 것을 취소하고 확대/이동으로 */
function cancelStroke() {
  if (pending) { clearTimeout(pending.timer); pending = null; }
  if (drag) {
    for (const [e, [o]] of drag.batch) G.state[e] = o;
    drag = null;
    renderBoard();
  }
}

svg.addEventListener('pointerdown', (ev) => {
  if (!G.grid || G.generating) return;
  const middle = ev.pointerType === 'mouse' && ev.button === 1;
  if (ev.pointerType === 'touch' || middle) {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (middle || ptrs.size >= 2 || pinch) {
      ev.preventDefault();
      try { svg.setPointerCapture(ev.pointerId); } catch (err) { /* 무시 */ }
      cancelStroke(); setHover(-1); pinchBase();
      return;
    }
  }
  if (!running()) return;
  const touch = ev.pointerType !== 'mouse';
  if (!touch && ev.button !== 0 && ev.button !== 2) return;
  const e = edgeAt(ev, touch);
  if (e < 0) return;
  ev.preventDefault();
  try { svg.setPointerCapture(ev.pointerId); } catch (err) { /* 무시 */ }
  setHover(-1);
  if (!touch) { startDrag(e, ev.button === 2 ? CROSS : G.mode); return; }
  if (G.mode === CROSS) { startDrag(e, CROSS); return; }
  pending = {
    e, id: ev.pointerId,
    timer: setTimeout(() => {           // 길게 누르기 → X
      if (!pending) return;
      const pe = pending.e;
      pending = null;
      startDrag(pe, CROSS);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 420),
  };
});
svg.addEventListener('pointermove', (ev) => {
  if (ptrs.has(ev.pointerId)) {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch) { pinchMove(); return; }
  }
  const touch = ev.pointerType !== 'mouse';
  if (pending && ev.pointerId === pending.id) {
    const e = edgeAt(ev, true);
    if (e !== pending.e) {               // 다른 변으로 움직이면 → 선 드래그
      clearTimeout(pending.timer);
      const pe = pending.e;
      pending = null;
      startDrag(pe, LINE);
      dragSet(e);
    }
    return;
  }
  if (drag) { dragSet(edgeAt(ev, touch)); return; }
  if (!touch && running()) setHover(edgeAt(ev, false));
});
function finishPointer(ev) {
  ptrs.delete(ev.pointerId);
  if (pinch) {                         // 남은 손가락으로는 계속 이동만 (그리지 않음)
    if (ptrs.size) pinchBase(); else pinch = null;
    return;
  }
  if (pending && ev.pointerId === pending.id) {
    clearTimeout(pending.timer);
    const pe = pending.e;
    pending = null;
    if (ev.type === 'pointerup') startDrag(pe, LINE);   // 짧은 탭 → 선
  }
  if (drag) commitDrag();
}
svg.addEventListener('pointerup', finishPointer);
svg.addEventListener('pointercancel', finishPointer);
svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !drag) setHover(-1); });
svg.addEventListener('contextmenu', (ev) => ev.preventDefault());
svg.addEventListener('wheel', (ev) => {          // 마우스 휠 / 트랙패드 핀치(ctrl+휠)로 확대
  if (!G.grid || G.generating) return;
  ev.preventDefault();
  const dy = ev.deltaY * (ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? 400 : 1);
  zoomAt(ev.clientX, ev.clientY, Math.exp(-dy * (ev.ctrlKey ? 0.01 : 0.0025)));
}, { passive: false });
svg.addEventListener('mousedown', (ev) => { if (ev.button === 1) ev.preventDefault(); });   // 자동 스크롤 막기
svg.addEventListener('auxclick', (ev) => { if (ev.button === 1) ev.preventDefault(); });
$('zoom-reset').addEventListener('click', resetZoom);
$('zoom-in').addEventListener('click', () => zoomCenter(1.5));
$('zoom-out').addEventListener('click', () => zoomCenter(1 / 1.5));

/* ───────── 공유 ───────── */
let toastTimer = null;
function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 아래 방법으로 */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

/* 공유 링크는 쿼리 문자열(?p=…&t=…)로 만든다.
   '#' 뒤 부분은 카카오톡 등 일부 앱/인앱 브라우저에서 잘릴 수 있어서. (예전 #p= 링크도 계속 열림) */
function shareUrl(withTime) {
  let q = `?p=${encodePuzzle(G.size, G.diff, G.clues)}`;
  if (withTime) q += `&t=${Math.floor(elapsed())}`;
  if (G.daily) q += `&d=${G.daily}`;
  return location.origin + location.pathname + q;
}

/* ───────── 공유 이미지 (캔버스로 그리기) ───────── */
const IMG = { bg: '#EEF1F8', card: '#FFFFFF', text: '#1B1E2E', sub: '#6E7491', dot: '#C3C8D8',
  clue: '#1B1E2E', done: '#B9BED0', line: '#5B5BF0', win: '#10B981', accent: '#5B5BF0', chip: '#E2E6F1' };
const IMG_FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", "Malgun Gothic", sans-serif';

function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}

function renderShareImage(brag) {
  const W = 800, c = document.createElement('canvas');
  c.width = W; c.height = W;
  const x = c.getContext('2d'), g = G.grid, n = g.R;
  const grad = x.createLinearGradient(0, 0, W, W);
  grad.addColorStop(0, '#EEF1F8'); grad.addColorStop(1, '#E3E5FB');
  x.fillStyle = grad; x.fillRect(0, 0, W, W);

  // 머리글
  x.fillStyle = IMG.text; x.textBaseline = 'middle';
  x.font = `800 44px ${IMG_FONT}`;
  x.fillText('Slither Link', 60, 76);
  const tag = G.daily ? `오늘의 퍼즐 · ${shortDay(G.daily)}` : `${n}×${n} · ${G.diff}`;
  x.font = `700 26px ${IMG_FONT}`;
  const tw = x.measureText(tag).width + 40;
  x.fillStyle = IMG.chip; roundRect(x, W - 60 - tw, 52, tw, 48, 24); x.fill();
  x.fillStyle = IMG.text; x.textAlign = 'center'; x.fillText(tag, W - 60 - tw / 2, 77); x.textAlign = 'left';

  // 판
  const B = 560, bx = (W - B) / 2, by = 130;
  x.save(); x.shadowColor = 'rgba(42,51,88,.14)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
  x.fillStyle = IMG.card; roundRect(x, bx, by, B, B, 34); x.fill(); x.restore();
  const pad = 40, cs = (B - pad * 2) / n, ox = bx + pad, oy = by + pad;
  const lines = brag ? G.solution : G.state.map((v) => (v === LINE ? 1 : 0));
  x.font = `600 ${Math.round(cs * 0.46)}px "Segoe UI", ${IMG_FONT}`;
  x.textAlign = 'center';
  G.clues.forEach((k, cell) => {
    if (k === null) return;
    x.fillStyle = brag ? IMG.done : IMG.clue;
    x.fillText(String(k), ox + (cell % n + 0.5) * cs, oy + (Math.floor(cell / n) + 0.55) * cs);
  });
  x.strokeStyle = brag ? IMG.win : IMG.line; x.lineWidth = cs * 0.13; x.lineCap = 'round';
  for (let e = 0; e < g.ne; e++) {
    if (!lines[e]) continue;
    const [a, b] = g.edgeVerts[e];
    x.beginPath();
    x.moveTo(ox + (a % (n + 1)) * cs, oy + Math.floor(a / (n + 1)) * cs);
    x.lineTo(ox + (b % (n + 1)) * cs, oy + Math.floor(b / (n + 1)) * cs);
    x.stroke();
  }
  x.fillStyle = IMG.dot;
  for (let v = 0; v < g.nvert; v++) {
    if (g.vertEdges[v].some((e) => lines[e])) continue;
    x.beginPath(); x.arc(ox + (v % (n + 1)) * cs, oy + Math.floor(v / (n + 1)) * cs, Math.max(3, cs * 0.055), 0, Math.PI * 2); x.fill();
  }

  // 아래 문구
  x.textAlign = 'center';
  if (brag) {
    x.fillStyle = IMG.win; x.font = `800 44px ${IMG_FONT}`;
    x.fillText(`✓ ${fmt(elapsed())} 만에 완성!`, W / 2, 735);
  } else {
    x.fillStyle = IMG.accent; x.font = `800 40px ${IMG_FONT}`;
    x.fillText('이 퍼즐 같이 풀어볼래요?', W / 2, 735);
  }
  return c;
}

/* ───────── 카카오톡 공유 (JavaScript 키 · 등록된 도메인에서만 동작) ───────── */
const KAKAO_KEY = '7d4bc1ef953608ec41d536ba29ff43a4';
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js';
const KAKAO_SRI = 'sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E';
const OG_IMAGE = 'https://hy1116.github.io/slither-link/og-image.png';
let kakaoLoading = null;

function loadKakao() {
  if (!kakaoLoading) {
    kakaoLoading = new Promise((resolve, reject) => {
      if (window.Kakao) { resolve(window.Kakao); return; }
      const el = document.createElement('script');
      el.src = KAKAO_SDK; el.integrity = KAKAO_SRI; el.crossOrigin = 'anonymous';
      el.onload = () => (window.Kakao ? resolve(window.Kakao) : reject(new Error('no Kakao')));
      el.onerror = () => reject(new Error('Kakao SDK load failed'));
      document.head.appendChild(el);
    }).then((K) => { if (!K.isInitialized()) K.init(KAKAO_KEY); return K; })
      .catch((e) => { kakaoLoading = null; throw e; });
  }
  return kakaoLoading;
}

/* ───────── 공유 창 ───────── */
let SH = null;   // 지금 열린 공유 정보 { brag, url, text, title, canvas, blob, kakaoImage }

function openShare(brag) {
  if (!G.grid || G.generating) return;
  brag = !!brag && G.won;
  const t = fmt(elapsed());
  const sz = G.daily ? `오늘의 퍼즐(${dayLabel(G.daily)})` : `${G.size}×${G.size} ${G.diff}`;
  const extra = brag && G.hints ? ` (힌트 ${G.hints}회)` : '';
  const streak = brag && G.daily && !G.practice ? ` 🔥 ${stats.dailyStreaks(kstToday())[0]}일 연속!` : '';
  SH = {
    brag, url: shareUrl(brag),
    title: brag ? `슬리더 링크 ${sz} — ${t} 완성!` : `슬리더 링크 ${sz}`,
    text: brag ? `슬리더 링크 ${sz} 퍼즐을 ${t}에 풀었어요${extra}!${streak} 나보다 빨리 풀 수 있어요? 🧩`
      : `슬리더 링크 ${sz} 퍼즐 같이 풀어요 🧩`,
    canvas: renderShareImage(brag), blob: null, kakaoImage: null,
  };
  $('share-title').textContent = brag ? '자랑하기' : '퍼즐 공유하기';
  $('share-msg').textContent = brag ? `${t} 기록이 담긴 도전 링크를 보내요. 친구가 열면 내 기록과 비교돼요.`
    : '친구가 링크를 열면 똑같은 퍼즐이 나와요.';
  $('share-preview').src = SH.canvas.toDataURL('image/png');
  $('share-more').hidden = !navigator.share;
  openModal('share');

  // 카카오톡을 누르는 순간 바로 열리도록 미리 준비 (SDK + 이미지 업로드)
  const cur = SH;
  new Promise((res) => cur.canvas.toBlob(res, 'image/png')).then((blob) => {
    cur.blob = blob;
    return loadKakao().then((K) => K.Share.uploadImage({ file: [new File([blob], 'slither-link.png', { type: 'image/png' })] }));
  }).then((r) => { cur.kakaoImage = r.infos.original; }).catch(() => { /* 실패하면 기본 이미지 사용 */ });
}

function kakaoPayload(sh) {
  const img = sh.kakaoImage || { url: OG_IMAGE, width: 1200, height: 630 };
  const link = { mobileWebUrl: sh.url, webUrl: sh.url };
  return {
    objectType: 'feed',
    content: {
      title: sh.title,
      description: sh.brag ? '나보다 빨리 풀 수 있어요? 같은 퍼즐로 도전해 보세요!' : '점을 이어 하나의 고리를 만드는 논리 퍼즐. 같이 풀어봐요!',
      imageUrl: img.url, imageWidth: img.width, imageHeight: img.height, link,
    },
    buttons: [{ title: sh.brag ? '도전하기' : '퍼즐 풀기', link }],
  };
}

async function shareKakao() {
  const sh = SH;
  try {
    const K = await loadKakao();
    K.Share.sendDefault(kakaoPayload(sh));
    closeModal('share');
  } catch (e) {
    toast('카카오톡 공유를 열지 못했어요');
  }
}

async function shareCopy() {
  const ok = await copyText(`${SH.text}\n${SH.url}`);
  toast(ok ? '링크를 복사했어요' : '복사하지 못했어요');
  if (ok) closeModal('share');
}

async function shareMore() {
  const sh = SH, data = { title: 'Slither Link', text: sh.text, url: sh.url };
  if (sh.brag && sh.blob) {                     // 자랑하기: 이미지도 함께 (지원하는 기기만)
    const file = new File([sh.blob], 'slither-link.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
  }
  try { await navigator.share(data); closeModal('share'); } catch (e) {
    if (e && e.name !== 'AbortError') toast('공유하지 못했어요');
  }
}

function shareSave() {
  const a = document.createElement('a');
  a.href = SH.canvas.toDataURL('image/png');
  a.download = SH.brag ? `slither-link-${G.size}x${G.size}-${fmt(elapsed()).replace(/:/g, '')}.png` : 'slither-link-puzzle.png';
  document.body.appendChild(a); a.click(); a.remove();
  toast('이미지를 저장했어요');
}

/* 공유 링크로 들어왔을 때: ?p=<퍼즐 코드>&t=<친구 기록(초)>  (예전 형식 #p=… 도 지원) */
function shareParams() {
  const search = new URLSearchParams(location.search);
  if (search.has('p')) return search;
  if (location.hash.startsWith('#p=')) return new URLSearchParams(location.hash.slice(1));
  return null;
}
function readShareHash() {
  const q = shareParams();
  if (!q) return null;
  history.replaceState(null, '', location.pathname);   // 새로고침 때 다시 열리지 않게
  const p = decodePuzzle(q.get('p'));
  if (!p || !SIZES.includes(p.n) || !DIFFS.includes(p.diff)) return { bad: true };
  const t = Number(q.get('t'));
  p.time = Number.isInteger(t) && t >= 0 && t < 360000 ? t : null;
  const d = q.get('d');
  p.daily = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  return p;
}

async function openShared(p) {
  const res = await runJob({ type: 'solve', n: p.n, clues: p.clues });
  if (res.count !== 1) return false;           // 답이 없거나 여러 개 → 잘못된 링크
  const go = () => {
    G.genId++;                                  // 만들던 퍼즐이 있으면 버림
    G.size = p.n; G.diff = p.diff; savePrefs();
    loadPuzzle({ R: p.n, C: p.n, clues: p.clues, solution: res.solution }, null, 0, 0,
      { challenge: p.time !== null ? { time: p.time } : null });
    toast(G.challenge ? `친구 기록 ${fmt(p.time)}에 도전!` : '공유받은 퍼즐을 열었어요');
  };
  if (hasProgress()) {
    openConfirm({
      title: '공유받은 퍼즐을 열까요?', msg: '지금 풀던 퍼즐은 \'포기\'로 기록돼요.', ok: '열기', icon: '↗',
      action: () => { recordQuit(); go(); },
    });
  } else go();
  return true;
}

async function handleShareHash() {
  const p = readShareHash();
  if (!p) return false;
  if (p.bad) { toast('잘못된 공유 링크예요'); return false; }
  // 오늘 날짜의 '오늘의 퍼즐' 링크이고 아직 안 풀었으면 → 진짜 오늘의 퍼즐로 (기록도 오늘의 퍼즐로 남음)
  if (p.daily === kstToday() && !stats.dailyWin(p.daily)) {
    requestDaily(p.time !== null ? { time: p.time } : null);
    return true;
  }
  if (!(await openShared(p))) { toast('잘못된 공유 링크예요'); return false; }
  return true;
}

/* ───────── 모달 ───────── */
const MODALS = ['confirm', 'share', 'stats', 'help'];
const isOpen = (id) => !$(id).hidden;
const modalOpen = () => MODALS.some(isOpen);
let confirmAction = null;

function openModal(id) { $(id).hidden = false; setHover(-1); }
function closeModal(id) { $(id).hidden = true; }
function closeTopModal() {
  for (const id of MODALS) if (isOpen(id)) { closeModal(id); return true; }   // 확인 창이 가장 위
  return false;
}
function openConfirm({ title, msg, ok, icon, danger = false, action }) {
  $('confirm-title').textContent = title;
  $('confirm-msg').textContent = msg;
  $('confirm-ok').textContent = ok;
  $('confirm-ok').classList.toggle('danger', danger);
  $('confirm-icon').textContent = icon;
  $('confirm-icon').classList.toggle('warn', danger);
  confirmAction = action;
  openModal('confirm');
}
function confirmOk() {
  closeModal('confirm');
  const a = confirmAction;
  confirmAction = null;
  if (a) a();
}

/* ───────── 새 게임 (진행 중이면 확인) ───────── */
const hasProgress = () => running() && (G.state.some((s) => s) || elapsed() >= 30);

function requestNewGame(before = null, title = '새 게임을 시작할까요?') {
  if (G.generating) return;
  const go = () => { if (before) before(); savePrefs(); newGame(); };
  if (!hasProgress()) { go(); return; }
  openConfirm({
    title, msg: '지금 풀던 퍼즐은 \'포기\'로 기록돼요.', ok: '새 게임', icon: '↻',
    action: () => {   // 확인 창에서 '새 게임'을 눌렀을 때만 포기로 기록
      recordQuit();
      go();
    },
  });
}

/* ───────── 통계 창 ───────── */
function renderStats() {
  const today = kstToday(), [dc, db, dt] = stats.dailyStreaks(today);
  let strip = '';
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i), done = !!stats.dailyWin(d);
    strip += `<div class="${done ? 'done' : ''} ${i === 0 ? 'today' : ''}">${i === 0 ? '오늘' : '일월화수목금토'[weekday(d)]}<i>${done ? '✓' : ''}</i></div>`;
  }
  $('stat-daily').innerHTML = `<div class="daily-head"><b>📅 오늘의 퍼즐</b>
    <span><span class="fire">🔥 ${dc}일 연속</span> · 최고 ${db}일 · 총 ${dt}회</span></div>
    <div class="daily-strip">${strip}</div>`;
  const st = stats.summary(), [cur, bestStreak] = stats.streaks();
  const tiles = [
    [st.played, '플레이'], [st.won, '완성'],
    [st.rate === null ? '-' : `${Math.round(st.rate * 100)}%`, '완성률'],
    [cur, `연속 완성 · 최고 ${bestStreak}`],
  ];
  $('stat-tiles').innerHTML = tiles.map(([v, l], i) =>
    `<div class="tile"><b class="${i === 3 && cur ? 'accent' : ''}">${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  setOn($('seg-stab'), G.statsTab);

  let html;
  if (G.statsTab === 0) {
    html = '<table class="stable"><tr><th>구분</th><th>플레이</th><th>완성률</th><th>최고</th><th>평균</th></tr>';
    for (const n of SIZES) for (const d of DIFFS) {
      const s = stats.summary(n, d);
      const none = (v) => (v === null || v === 0 ? '<span class="none">-</span>' : v);
      html += `<tr class="${n === G.size && d === G.diff ? 'here' : ''}">
        <td>${n}×${n}&nbsp; ${esc(d)}</td><td>${none(s.played)}</td>
        <td>${s.rate === null ? none(null) : Math.round(s.rate * 100) + '%'}</td>
        <td class="${s.best !== null ? 'best' : ''}">${s.best === null ? none(null) : fmt(s.best)}</td>
        <td>${s.avg === null ? none(null) : fmt(s.avg)}</td></tr>`;
    }
    html += '</table>';
  } else {
    const games = stats.recent(10);
    if (!games.length) html = '<p class="empty">아직 기록이 없어요.<br>퍼즐을 완성해 보세요!</p>';
    else {
      html = '<table class="stable">';
      games.forEach((g, i) => {
        const cls = { '완성': 'r-완성', '포기': 'r-포기', '정답 보기': 'r-정답' }[g.result] || '';
        html += `<tr class="${i % 2 === 0 ? 'alt' : ''}"><td class="date">${esc(String(g.date || '').slice(5))}</td>
          <td>${g.daily ? '📅 ' : ''}${esc(g.size)}×${esc(g.size)}&nbsp; ${esc(g.diff)}</td>
          <td>${fmt(g.time || 0)}${g.hints ? ` <span class="none">💡${esc(g.hints)}</span>` : ''}</td>
          <td class="${cls}">${esc(g.result)}</td></tr>`;
      });
      html += '</table>';
    }
  }
  $('stat-body').innerHTML = html;
  $('btn-clear-stats').disabled = !stats.games.length;
}
function openStats() { renderStats(); openModal('stats'); }

/* ───────── 테마 ───────── */
function effectiveTheme() {
  return document.documentElement.dataset.theme
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function syncThemeColor() {
  document.querySelector('meta[name="theme-color"]').content = effectiveTheme() === 'dark' ? '#0E1016' : '#EEF1F8';
}
function toggleTheme() {
  document.documentElement.dataset.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
  savePrefs(); syncThemeColor();
}

/* ───────── 연결 ───────── */
function buildSeg(el, labels, onPick) {
  el.textContent = '';
  labels.forEach((l, i) => {
    const b = document.createElement('button');
    b.textContent = l;
    b.addEventListener('click', () => onPick(i));
    el.appendChild(b);
  });
}
buildSeg($('seg-size'), SIZES.map((n) => `${n}×${n}`), (i) => {
  if (SIZES[i] === G.size && !G.solved) return;
  requestNewGame(() => { G.size = SIZES[i]; }, `${SIZES[i]} × ${SIZES[i]} 크기로 바꿀까요?`);
});
buildSeg($('seg-diff'), DIFFS, (i) => {
  if (DIFFS[i] === G.diff && !G.solved) return;
  requestNewGame(() => { G.diff = DIFFS[i]; }, `난이도를 '${DIFFS[i]}'(으)로 바꿀까요?`);
});
$('seg-mode').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => { G.mode = Number(b.dataset.mode); render(); }));
$('seg-stab').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => { G.statsTab = Number(b.dataset.tab); renderStats(); }));

$('btn-new').addEventListener('click', () => requestNewGame());
$('btn-next').addEventListener('click', () => requestNewGame());
$('btn-share').addEventListener('click', () => openShare(false));
$('btn-share-win').addEventListener('click', () => openShare(true));
$('share-kakao').addEventListener('click', shareKakao);
$('share-copy').addEventListener('click', shareCopy);
$('share-more').addEventListener('click', shareMore);
$('share-save').addEventListener('click', shareSave);
/* 완성 카드 바깥을 눌러 닫기. 마지막 선을 그은 손가락이 떼어질 때 뒤늦게 오는 click 이
   막 나타난 카드 배경에 떨어져 바로 닫히지 않도록, 누르기 시작한 곳도 배경이어야 한다. */
let winPressed = false;
$('win').addEventListener('pointerdown', (ev) => { winPressed = ev.target === $('win'); });
$('win').addEventListener('click', (ev) => {
  if (ev.target === $('win') && winPressed) { G.overlayHidden = true; render(); }
  winPressed = false;
});
$('btn-stats').addEventListener('click', openStats);
$('btn-help').addEventListener('click', () => openModal('help'));
$('btn-theme').addEventListener('click', toggleTheme);
$('t-undo').addEventListener('click', undo);
$('t-redo').addEventListener('click', redo);
$('t-cross').addEventListener('click', autoCross);
$('t-hint').addEventListener('click', useHint);
$('btn-daily').addEventListener('click', () => requestDaily());
$('t-reset').addEventListener('click', resetBoard);
$('t-reveal').addEventListener('click', showSolution);
$('confirm-ok').addEventListener('click', confirmOk);
$('confirm-cancel').addEventListener('click', () => closeModal('confirm'));
$('btn-clear-stats').addEventListener('click', () => openConfirm({
  title: '통계를 초기화할까요?', msg: '모든 기록이 삭제되고 되돌릴 수 없어요.', ok: '초기화', icon: '!', danger: true,
  action: () => { stats.clear(); renderStats(); },
}));
for (const id of MODALS) {
  $(id).addEventListener('click', (ev) => { if (ev.target === $(id)) closeModal(id); });   // 바깥 클릭
  $(id).querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModal(id)));
}

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { closeTopModal(); return; }
  if (isOpen('confirm')) { if (ev.key === 'Enter') { ev.preventDefault(); confirmOk(); } return; }
  if (modalOpen()) return;
  const mod = ev.ctrlKey || ev.metaKey;
  if (mod && ev.code === 'KeyZ') { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); return; }
  if (mod && ev.code === 'KeyY') { ev.preventDefault(); redo(); return; }
  if (mod || ev.altKey) return;
  if (ev.code === 'KeyN') requestNewGame();
  else if (ev.code === 'KeyD') toggleTheme();
  else if (ev.code === 'KeyS') openStats();
  else if (ev.code === 'KeyH') useHint();
  else if (ev.key === '+' || ev.key === '=') zoomCenter(1.25);
  else if (ev.key === '-' || ev.key === '_') zoomCenter(1 / 1.25);
  else if (ev.key === '0') resetZoom();
});

/* iOS: 빠르게 두 번 탭하면 확대되는 것 / 두 손가락 확대 막기 (버튼 연타는 그대로 동작) */
let lastTouchEnd = 0;
document.addEventListener('touchend', (ev) => {
  const now = Date.now();
  if (now - lastTouchEnd < 350 && !ev.target.closest('button, a, input, textarea')) ev.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
document.addEventListener('gesturestart', (ev) => ev.preventDefault());
document.addEventListener('dblclick', (ev) => ev.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseClock(); saveGame(); } else { resumeClock(); }
});
window.addEventListener('pagehide', saveGame);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeColor);
matchMedia('(pointer: coarse)').addEventListener?.('change', render);

/* 규칙 창 예시 그림의 점 */
[[3, 0], [0, 2]].forEach(([c, r]) => mk('circle', { cx: c * 100, cy: r * 100, r: 7 }, $('ex-dots')));   // 선이 지나지 않는 점만

/* 오프라인 지원 (https 또는 localhost 에서만) */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* 시작 */
syncThemeColor();
(async () => {
  const restored = restoreGame();
  if (shareParams()) {
    if (!restored) $('spinner').hidden = false;             // 링크 확인하는 동안 로딩 표시
    const ok = await handleShareHash();
    if (ok || restored) return;
  }
  if (!restored) newGame();
})();
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#p=') && !G.generating) handleShareHash();
});
