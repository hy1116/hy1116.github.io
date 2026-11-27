/* 텐트 웹 버전 — 화면 · 입력 · 게임 흐름 · 기록 (지뢰찾기와 같은 뼈대) */
'use strict';

const M_TENT = 0, M_GRASS = 1;            // 터치에서 '탭'이 할 일
const LEVEL_NAMES = Object.keys(LEVELS);
const CELL = 100, MARGIN = 14, INSET = 4, CLUE = 76;   // CLUE: 위·왼쪽 숫자 줄의 폭
const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/* ───────── 저장소 ───────── */
const K_PREFS = 'tents.prefs.v1', K_STATS = 'tents.stats.v1', K_GAME = 'tents.game.v1';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } },
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
const addDays = (date, k) => new Date(Date.parse(date + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
const weekday = (date) => new Date(date + 'T00:00:00Z').getUTCDay();          // 0=일 … 6=토
const dayLabel = (date) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
const DAILY_SEED = 'tents-daily-v1:';        // 바꾸면 모든 날짜의 퍼즐이 바뀜
const dailyLevel = (date) => ([0, 6].includes(weekday(date)) ? '어려움' : '보통');   // 주말은 어려움

/* ───────── 기록 ───────── */
const WIN = '성공', QUIT = '포기';
class Stats {
  constructor() {
    const d = store.get(K_STATS, {});
    this.games = Array.isArray(d.games) ? d.games.filter((g) => g && typeof g === 'object') : [];
  }
  save() { store.set(K_STATS, { version: 1, games: this.games }); }
  add(level, secs, result, extra = {}) {
    const t = new Date(), p = (x) => String(x).padStart(2, '0');
    const g = { date: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`,
      level, time: Math.floor(secs), result };
    for (const k in extra) if (extra[k]) g[k] = extra[k];       // daily · hints (있을 때만)
    this.games.push(g);
    this.save();
  }
  clear() { this.games = []; this.save(); }
  summary(level = null) {
    const gs = this.games.filter((g) => level === null || g.level === level);
    const won = gs.filter((g) => g.result === WIN), times = won.filter((g) => !g.hints).map((g) => g.time || 0);
    return {
      played: gs.length, won: won.length,
      rate: gs.length ? won.length / gs.length : null,
      best: times.length ? Math.min(...times) : null,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
    };
  }
  best(level) { return this.summary(level).best; }
  streaks() {
    let cur = 0, best = 0;
    for (const g of this.games) { if (g.result === WIN) { cur++; best = Math.max(best, cur); } else cur = 0; }
    return [cur, best];
  }
  recent(k = 10) { return this.games.slice(-k).reverse(); }
  dailyWin(date) { return this.games.find((g) => g.daily === date && g.result === WIN) || null; }
  dailyStreaks(today) {                     // [지금 연속, 최고 연속, 총 완료 일수]
    const days = new Set(this.games.filter((g) => g.daily && g.result === WIN).map((g) => g.daily));
    let cur = 0, d = days.has(today) ? today : addDays(today, -1);
    while (days.has(d)) { cur++; d = addDays(d, -1); }
    let best = 0, run = 0, prev = null;
    for (const x of [...days].sort()) { run = prev && addDays(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; }
    return [cur, best, days.size];
  }
}
const stats = new Stats();
function record(result) {
  if (G.practice) return;                   // 이미 완료한 오늘의 퍼즐을 다시 풀 때는 기록 안 남김
  stats.add(G.level, elapsed(), result, { daily: G.daily, hints: G.hints });
}

const prefs = store.get(K_PREFS, {});
function savePrefs() {                     // 오늘의 퍼즐 난이도는 평소 설정으로 저장하지 않는다
  if (!G.daily) prefs.level = G.level;
  store.set(K_PREFS, { level: prefs.level, theme: document.documentElement.dataset.theme || null });
}

/* ───────── 게임 상태 ───────── */
const G = {
  level: LEVEL_NAMES.includes(prefs.level) ? prefs.level : '쉬움',
  R: 6, C: 6, tree: null, rows: null, cols: null, solution: null,
  st: null,                             // 칸 상태 U / TENT / GRASS (나무 칸은 안 씀)
  undo: [], hints: 0, flash: null,     // flash: 힌트로 잠깐 강조할 { i, line }
  over: false, won: false, newBest: false, prevBest: null, overlayHidden: false,
  acc: 0, since: null, mode: M_TENT, hover: -1,
  acted: false,
  daily: null, practice: false,         // 오늘의 퍼즐이면 날짜 / 이미 완료한 날 다시 풀기
  challenge: null,                      // 공유받은 기록 { time } — 다 풀면 비교
};
const n = () => G.R * G.C;
const playing = () => !!G.st && !G.over;
const puzzle = () => ({ R: G.R, C: G.C, tree: G.tree, rows: G.rows, cols: G.cols });
const treeCount = () => G.tree.reduce((a, b) => a + b, 0);
const tentCount = () => G.st.reduce((a, v, i) => a + (v === TENT && !G.tree[i] ? 1 : 0), 0);

/* ───────── 시계 ───────── */
const elapsed = () => (G.acc + (G.since !== null ? Date.now() - G.since : 0)) / 1000;
function pauseClock() { if (G.since !== null) { G.acc += Date.now() - G.since; G.since = null; } }
function resumeClock() { if (G.since === null && playing() && G.acted && !document.hidden) G.since = Date.now(); }
let shownDay = kstToday();
setInterval(() => {
  $('timer').textContent = fmt(elapsed());
  if (kstToday() !== shownDay) { shownDay = kstToday(); renderDailyButton(); }   // 자정이 지나면
}, 250);

/* ───────── 저장 / 복원 (새로고침해도 이어서) ───────── */
function saveGame() {
  if (!playing()) { store.del(K_GAME); return; }
  store.set(K_GAME, { level: G.level, R: G.R, C: G.C, tree: Array.from(G.tree), rows: G.rows, cols: G.cols,
    solution: G.solution, st: Array.from(G.st), elapsed: elapsed(), acted: G.acted,
    daily: G.daily, practice: G.practice, challenge: G.challenge, hints: G.hints });
}
function restoreGame() {
  const s = store.get(K_GAME, null);
  if (!s || !LEVELS[s.level]) return false;
  const N = s.R * s.C;
  if (![s.tree, s.st, s.solution].every((a) => Array.isArray(a) && a.length === N)) return false;
  if (!Array.isArray(s.rows) || s.rows.length !== s.R || !Array.isArray(s.cols) || s.cols.length !== s.C) return false;
  G.level = s.level; G.R = s.R; G.C = s.C;
  G.tree = Uint8Array.from(s.tree); G.rows = s.rows; G.cols = s.cols; G.solution = s.solution;
  G.st = Uint8Array.from(s.st);
  G.undo = []; G.over = G.won = false; G.overlayHidden = false;
  G.acc = (s.elapsed || 0) * 1000; G.since = null;
  G.acted = s.acted !== false;
  G.daily = typeof s.daily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.daily) ? s.daily : null;
  G.practice = !!s.practice;
  G.hints = Number.isInteger(s.hints) && s.hints > 0 ? s.hints : 0; G.flash = null;
  G.challenge = s.challenge && Number.isFinite(s.challenge.time) ? { time: s.challenge.time } : null;
  buildBoard();
  resumeClock();
  return true;
}

/* ───────── 새 퍼즐 ─────────
 * opts: { daily, practice, puzzle, challenge } — 오늘의 퍼즐은 날짜 시드로, 공유받은 퍼즐은 링크의 퍼즐로 */
function newGame(opts = {}) {
  const p = opts.puzzle || levelPuzzle(G.level, opts.daily ? DAILY_SEED + opts.daily : null);
  G.R = p.R; G.C = p.C;
  G.tree = Uint8Array.from(p.tree); G.rows = p.rows.slice(); G.cols = p.cols.slice(); G.solution = p.solution;
  G.st = new Uint8Array(n());
  G.undo = []; G.hints = 0; G.flash = null;
  G.over = G.won = false; G.newBest = false; G.prevBest = null; G.overlayHidden = false;
  G.acc = 0; G.since = null; G.hover = -1; G.acted = false;
  G.daily = opts.daily || null; G.practice = !!opts.practice;
  G.challenge = opts.challenge || null;
  store.del(K_GAME);
  buildBoard();
  saveGame();
  render();
}

function act() {                           // 첫 동작에서 시계 시작
  if (!G.acted) { G.acted = true; resumeClock(); }
}

/* ───────── 동작 ───────── */
function pushUndo() {
  G.undo.push(G.st.slice());
  if (G.undo.length > 300) G.undo.shift();
}
function setCell(i, v) {                   // 나무 칸은 못 바꾼다. 바뀌었으면 true
  if (i < 0 || G.tree[i] || G.st[i] === v) return false;
  G.st[i] = v;
  return true;
}
function toggle(i, v) {                    // v(텐트/잔디)를 놓거나, 이미 그거면 지우기
  if (G.over || i < 0 || G.tree[i]) return;
  act();
  pushUndo();
  setCell(i, G.st[i] === v ? U : v);
  if (v === TENT && navigator.vibrate && isTouch()) navigator.vibrate(10);
  afterChange();
}
const tapValue = () => (G.mode === M_GRASS && isTouch() ? GRASS : TENT);
function primary(i) { toggle(i, tapValue()); }
function secondary(i) { toggle(i, tapValue() === TENT ? GRASS : TENT); }

/* 줄 숫자를 누르면: 텐트를 다 친 줄의 남은 빈 칸을 잔디로 */
function fillLine(isRow, k) {
  if (G.over) return;
  const cells = lineCells(isRow, k), need = isRow ? G.rows[k] : G.cols[k];
  const t = cells.filter((i) => G.st[i] === TENT).length, empty = cells.filter((i) => G.st[i] === U);
  if (!empty.length) return;
  if (t < need) { toast(`이 줄은 텐트가 ${need - t}개 더 필요해요`); return; }
  if (t > need) { toast('이 줄은 텐트가 너무 많아요'); return; }
  act();
  pushUndo();
  empty.forEach((i) => setCell(i, GRASS));
  afterChange();
}
function lineCells(isRow, k) {
  const out = [];
  const len = isRow ? G.C : G.R;
  for (let p = 0; p < len; p++) {
    const i = isRow ? k * G.C + p : p * G.C + k;
    if (!G.tree[i]) out.push(i);
  }
  return out;
}

function undo() {
  if (G.over || !G.undo.length) return;
  G.st = G.undo.pop();
  G.flash = null;
  afterChange();
}
/* 처음부터: 놓은 텐트·잔디를 모두 지운다 (시간은 그대로, 되돌리기로 복구 가능) */
const hasMarks = () => !!G.st && G.st.some((v, i) => v !== U && !G.tree[i]);
function resetBoard() {
  if (G.over || !hasMarks()) return;
  pushUndo();
  G.st.fill(U);
  G.flash = null;
  afterChange();
  toast('처음 상태로 돌렸어요 · 되돌리기로 되살릴 수 있어요');
}

/* 힌트: 논리로 확정되는 칸 하나를 채우고 이유를 보여 준다. 틀린 칸이 있으면 그것부터 고친다 */
let flashTimer = null;
function giveHint() {
  if (G.over || !G.st) return;
  const h = hint(puzzle(), G.st, G.solution);
  if (!h) return;
  act();
  pushUndo();
  G.st[h.i] = h.v;
  G.hints++;
  G.flash = { i: h.i, line: h.line ? { isRow: h.line.isRow, k: h.line.k } : null };
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { G.flash = null; renderBoard(); }, 2600);
  toast(h.wrong ? `${h.why} · ${h.v === TENT ? '텐트' : '잔디'}로 고쳤어요` : `💡 ${h.why}`, 3600);
  afterChange();
}
function afterChange() { checkWin(); saveGame(); render(); }

function checkWin() {
  if (G.over || !isSolved(puzzle(), G.st)) return;
  pauseClock();
  G.over = G.won = true;
  for (let i = 0; i < n(); i++) if (!G.tree[i] && G.st[i] === U) G.st[i] = GRASS;   // 남은 칸은 잔디로
  const t = Math.floor(elapsed());
  G.prevBest = stats.best(G.level);
  G.newBest = !G.practice && !G.hints && (G.prevBest === null || t < G.prevBest);
  record(WIN);
  store.del(K_GAME);
  resetZoom();
  if (navigator.vibrate && isTouch()) navigator.vibrate([20, 40, 20]);
}

/* ───────── 규칙 위반 표시 ───────── */
function problems() {
  const { orth, all } = neighbors(G.R, G.C), N = n();
  const badTent = new Uint8Array(N), lonely = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (G.tree[i]) {                        // 옆에 텐트를 칠 자리가 하나도 없는 나무
      if (!orth[i].some((j) => !G.tree[j] && G.st[j] !== GRASS)) lonely[i] = 1;
    } else if (G.st[i] === TENT) {          // 텐트끼리 붙음 / 옆에 나무가 없음
      if (all[i].some((j) => !G.tree[j] && G.st[j] === TENT) || !orth[i].some((j) => G.tree[j])) badTent[i] = 1;
    }
  }
  const line = (isRow, k) => {
    const cells = lineCells(isRow, k), need = isRow ? G.rows[k] : G.cols[k];
    const t = cells.filter((i) => G.st[i] === TENT).length, u = cells.filter((i) => G.st[i] === U).length;
    return t > need || t + u < need ? 'over' : t === need ? 'done' : '';
  };
  return { badTent, lonely, rowState: G.rows.map((_, k) => line(true, k)), colState: G.cols.map((_, k) => line(false, k)) };
}

/* ───────── 판 (SVG) ───────── */
const svg = $('board');
let cellEls = [], drawn = [], rowClues = [], colClues = [];

function mk(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}
const BLADES = 'M30 72q3-12-3-22M50 74q2-16-2-28M70 72q-3-12 3-22';

function buildBoard() {
  const R = G.R, C = G.C, W = CLUE + C * CELL + 2 * MARGIN, H = CLUE + R * CELL + 2 * MARGIN;
  $('board-card').style.setProperty('--ar', `${W} / ${H}`);
  Z.full = { x: -MARGIN - CLUE, y: -MARGIN - CLUE, w: W, h: H };
  cancelAnimationFrame(Z.anim);
  applyView(Z.full.x, Z.full.y, Z.full.w);
  [...svg.querySelectorAll('g.cells')].forEach((g) => g.remove());
  const root = mk('g', { class: 'cells' }, svg);
  cellEls = []; drawn = []; rowClues = []; colClues = [];
  for (let i = 0; i < R * C; i++) {
    const x = (i % C) * CELL, y = Math.floor(i / C) * CELL;
    const g = mk('g', { class: 'c', transform: `translate(${x} ${y})` }, root);
    mk('rect', { class: 't', x: INSET, y: INSET, width: CELL - 2 * INSET, height: CELL - 2 * INSET, rx: 16 }, g);
    const b = mk('path', { class: 'blade', d: BLADES, display: 'none' }, g);
    const u = mk('use', { x: 12, y: 12, width: 76, height: 76 }, g);
    if (G.tree[i]) u.setAttribute('href', '#i-tree');
    cellEls.push({ g, b, u });
    drawn.push('');
  }
  for (let r = 0; r < R; r++)
    rowClues.push(mk('text', { class: 'clue', x: -CLUE / 2 - 4, y: r * CELL + CELL / 2 + 2 }, root));
  for (let c = 0; c < C; c++)
    colClues.push(mk('text', { class: 'clue', x: c * CELL + CELL / 2, y: -CLUE / 2 - 2 }, root));
  rowClues.forEach((t, k) => { t.textContent = G.rows[k]; });
  colClues.forEach((t, k) => { t.textContent = G.cols[k]; });
  svg.classList.add('fresh');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('fresh')));
}

function renderBoard() {
  if (!G.st) return;
  svg.classList.toggle('won', G.won);
  const P = problems();
  for (let i = 0; i < cellEls.length; i++) {
    let cls = 'c', kind = '';
    if (G.tree[i]) { cls += ' tree'; if (P.lonely[i] && !G.won) cls += ' lonely'; }
    else if (G.st[i] === TENT) { cls += ' tent'; kind = 'tent'; if (P.badTent[i] && !G.won) cls += ' bad'; }
    else if (G.st[i] === GRASS) { cls += ' grass'; kind = 'grass'; }
    if (G.flash && G.flash.i === i && !G.won) cls += ' hint';
    if (!G.over && !G.tree[i]) {
      if (i === G.hover) cls += ' hover';
      if (i === pressCell) cls += ' press';
    }
    if (cls === drawn[i]) continue;
    drawn[i] = cls;
    const el = cellEls[i];
    el.g.setAttribute('class', cls);
    if (!G.tree[i]) {
      if (kind === 'tent') el.u.setAttribute('href', '#i-tent'); else el.u.removeAttribute('href');
      el.b.setAttribute('display', kind === 'grass' ? 'inline' : 'none');
    }
  }
  const fl = G.flash && G.flash.line;
  rowClues.forEach((t, k) => t.setAttribute('class', `clue ${G.won ? 'done' : P.rowState[k]}${fl && fl.isRow && fl.k === k ? ' hint' : ''}`));
  colClues.forEach((t, k) => t.setAttribute('class', `clue ${G.won ? 'done' : P.colState[k]}${fl && !fl.isRow && fl.k === k ? ' hint' : ''}`));
}

/* ───────── 화면 갱신 ───────── */
function render() {
  [...$('seg-level').children].forEach((b, i) => b.classList.toggle('on', LEVEL_NAMES[i] === G.level));
  [...$('seg-mode').children].forEach((b, i) => b.classList.toggle('on', i === G.mode));
  const tc = tentCount(), tr = treeCount();
  $('left').textContent = `${tc}/${tr}`;
  $('left').parentElement.classList.toggle('done', tc === tr);
  $('timer').textContent = fmt(elapsed());
  $('btn-undo').disabled = G.over || !G.undo.length;
  $('btn-reset').disabled = G.over || !hasMarks();
  $('btn-hint').disabled = G.over;
  $('hint-count').textContent = G.hints ? G.hints : '';

  renderDailyButton();
  const st = $('status'), best = stats.best(G.level);
  st.classList.toggle('win-text', G.won);
  st.classList.toggle('daily-text', !!G.daily && !G.over);
  st.classList.toggle('challenge', !!G.challenge && !G.over);
  if (G.won) st.textContent = `성공!  기록 ${fmt(elapsed())}`;
  else if (G.challenge) st.textContent = `⚑ 친구 기록 ${fmt(G.challenge.time)}에 도전 중!${G.practice ? ' (연습)' : ''}`;
  else if (G.daily) st.textContent = `📅 ${dayLabel(G.daily)} 오늘의 퍼즐 · ${G.level}${G.practice ? ' (연습 · 기록 안 남음)' : ''}`;
  else if (!G.acted) st.textContent = `나무마다 옆에 텐트를 하나씩${best !== null ? `  ·  최고 기록 ${fmt(best)}` : ''}`;
  else st.textContent = isTouch()
    ? (G.mode === M_GRASS ? '탭: 잔디   ·   길게 누르기: 텐트   ·   끌기: 잔디 칠하기' : '탭: 텐트   ·   길게 누르기: 잔디   ·   끌기: 잔디 칠하기')
    : '왼쪽 클릭: 텐트   ·   오른쪽 클릭: 잔디   ·   끌기: 잔디 칠하기';

  const show = G.won && !G.overlayHidden;
  $('over').hidden = !show;
  if (show) {
    const what = G.daily ? `${dayLabel(G.daily)} 오늘의 퍼즐 · ${G.level}` : `${G.level} · ${G.C}×${G.R} · 나무 ${treeCount()}그루`;
    $('over-meta').textContent = `${what} · ${fmt(elapsed())}${G.hints ? ` · 힌트 ${G.hints}번` : ''}`;
    const b = $('over-best');
    const dailyWin = G.daily && !G.practice;
    b.classList.toggle('new', G.newBest || dailyWin);
    if (G.practice) b.textContent = '연습이라 기록은 남지 않아요';
    else if (dailyWin) b.textContent = `🔥 오늘의 퍼즐 ${stats.dailyStreaks(kstToday())[0]}일 연속 완료!`;
    else if (G.newBest) b.textContent = '★  최고 기록 달성!';
    else if (G.hints) b.textContent = '힌트를 쓴 판은 최고 기록에 들어가지 않아요';
    else b.textContent = G.prevBest === null ? '' : `최고 기록 ${fmt(G.prevBest)}`;
    const ch = $('over-challenge');
    ch.hidden = !G.challenge;
    if (G.challenge) {
      const mine = Math.floor(elapsed()), theirs = G.challenge.time;
      ch.classList.toggle('lose', mine > theirs);
      ch.textContent = mine < theirs ? `⚑ 친구 기록 ${fmt(theirs)}보다 ${fmt(theirs - mine)} 빨랐어요!`
        : mine === theirs ? `⚑ 친구 기록 ${fmt(theirs)}와 동점!`
          : `친구 기록 ${fmt(theirs)}보다 ${fmt(mine - theirs)} 늦었어요`;
    }
  }
  renderBoard();
}

function renderDailyButton() {
  const today = kstToday(), done = stats.dailyWin(today), btn = $('btn-daily');
  const now = G.daily === today && !G.practice && playing();
  btn.classList.toggle('on', now);
  btn.classList.toggle('done', !!done && !now);
  $('daily-label').textContent = done ? `오늘 ✓ ${fmt(done.time)}` : '오늘의 퍼즐';
}

/* ───────── 오늘의 퍼즐 ───────── */
const hasProgress = () => playing() && G.acted;
function requestDaily(challenge = null) {
  const date = kstToday();
  if (G.daily === date && playing()) {
    if (challenge) { G.challenge = challenge; saveGame(); render(); toast(`친구 기록 ${fmt(challenge.time)}에 도전!`); }
    else toast('지금 오늘의 퍼즐을 풀고 있어요');
    return;
  }
  const done = stats.dailyWin(date), quit = hasProgress();
  const go = (practice) => {
    if (quit) record(QUIT);
    G.level = dailyLevel(date);              // 일반 게임 설정(prefs)은 그대로 둠
    newGame({ daily: date, practice, challenge });
    if (challenge) toast(`친구 기록 ${fmt(challenge.time)}에 도전!`);
  };
  const quitMsg = quit ? ' 지금 풀던 퍼즐은 \'포기\'로 기록돼요.' : '';
  if (done) openConfirm('오늘의 퍼즐 다시 풀기', `오늘은 이미 ${fmt(done.time)}에 완료했어요. 다시 풀면 기록은 남지 않아요.${quitMsg}`, '다시 풀기', () => go(true));
  else if (quit) openConfirm('오늘의 퍼즐을 시작할까요?', quitMsg.trim(), '시작', () => go(false));
  else go(false);
}

/* ───────── 통계 창 ───────── */
let statsTab = 0;
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
  const s = stats.summary(), [cur, bestStreak] = stats.streaks();
  const tiles = [[s.played, '플레이'], [s.won, '성공'],
    [s.rate === null ? '-' : `${Math.round(s.rate * 100)}%`, '성공률'], [cur, `연속 성공 · 최고 ${bestStreak}`]];
  $('stat-tiles').innerHTML = tiles.map(([v, l], i) =>
    `<div class="tile"><b class="${i === 3 && cur ? 'accent' : ''}">${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  [...$('seg-stab').children].forEach((b, i) => b.classList.toggle('on', i === statsTab));

  const none = '<span class="none">-</span>';
  let html;
  if (statsTab === 0) {
    html = '<table class="stable"><tr><th>난이도</th><th>플레이</th><th>성공률</th><th>최고</th><th>평균</th></tr>';
    for (const lv of LEVEL_NAMES) {
      const x = stats.summary(lv);
      html += `<tr class="${lv === G.level ? 'here' : ''}"><td>${esc(lv)}</td><td>${x.played || none}</td>
        <td>${x.rate === null ? none : Math.round(x.rate * 100) + '%'}</td>
        <td class="${x.best !== null ? 'best' : ''}">${x.best === null ? none : fmt(x.best)}</td>
        <td>${x.avg === null ? none : fmt(x.avg)}</td></tr>`;
    }
    html += '</table>';
  } else {
    const games = stats.recent(10);
    if (!games.length) html = '<p class="empty">아직 기록이 없어요.<br>한 판 풀어 보세요!</p>';
    else {
      html = '<table class="stable">';
      games.forEach((g, i) => {
        const cls = { [WIN]: 'r-win', [QUIT]: 'r-quit' }[g.result] || '';
        html += `<tr class="${i % 2 === 0 ? 'alt' : ''}"><td class="date">${esc(String(g.date || '').slice(5))}</td>
          <td>${g.daily ? '📅 ' : ''}${esc(g.level)}</td>
          <td>${fmt(g.time || 0)}</td>
          <td class="${cls}">${esc(g.result)}</td></tr>`;
      });
      html += '</table>';
    }
  }
  $('stat-body').innerHTML = html;
  $('btn-clear-stats').disabled = !stats.games.length;
}
function openStats() { renderStats(); openModal('stats'); }

let toastTimer = null;
function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ───────── 확대 · 이동 (지뢰찾기와 같은 방식: viewBox 를 바꾼다) ───────── */
const Z = { full: null, view: null, anim: 0 };
const maxZoom = () => Math.max(1.6, Math.min(G.R, G.C) / 4);
const zoomLevel = () => (Z.full && Z.view ? Z.full.w / Z.view.w : 1);
const clampW = (w) => Math.min(Z.full.w, Math.max(Z.full.w / maxZoom(), w));

function applyView(x, y, w) {
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
const ptrs = new Map();
let pinch = null;
function ptrCenter() {
  const ps = [...ptrs.values()], k = ps.length;
  const c = { x: ps.reduce((a, p) => a + p.x, 0) / k, y: ps.reduce((a, p) => a + p.y, 0) / k };
  c.d = k > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0;
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

/* ───────── 입력 ─────────
 * 탭 = 텐트(잔디 모드면 잔디), 길게 누르기 = 반대, 한 손가락으로 끌기 = 지나간 칸에 잔디 칠하기
 * (잔디 칸에서 시작하면 잔디 지우기). 줄 숫자 탭 = 남은 칸 잔디. 두 손가락 = 확대/이동. */
let press = null, pressCell = -1;          // { id, i, x, y, timer, mouse, paint }

function svgPoint(ev) {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  return pt.matrixTransform(m.inverse());
}
/* 칸 번호, 또는 줄 숫자면 { row } / { col }, 아니면 -1 */
function hitAt(ev) {
  if (!G.st) return -1;
  const p = svgPoint(ev);
  if (!p) return -1;
  const c = Math.floor(p.x / CELL), r = Math.floor(p.y / CELL);
  if (p.x < 0 && p.x >= -CLUE - MARGIN && r >= 0 && r < G.R) return { row: r };
  if (p.y < 0 && p.y >= -CLUE - MARGIN && c >= 0 && c < G.C) return { col: c };
  return r >= 0 && r < G.R && c >= 0 && c < G.C ? r * G.C + c : -1;
}
const cellAt = (ev) => { const h = hitAt(ev); return typeof h === 'number' ? h : -1; };
function setPress(i) { if (pressCell !== i) { pressCell = i; renderBoard(); } }
function setHover(i) { if (G.hover !== i) { G.hover = i; renderBoard(); } }
function cancelPress() {
  if (press) clearTimeout(press.timer);
  press = null;
  setPress(-1);
}
function startPan(ev) {
  ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  cancelPress(); setHover(-1); pinchBase();
}
function paintTo(i) {                      // 끌기: 같은 동작을 지나가는 칸마다
  if (i < 0 || G.tree[i] || press.paint.done.has(i)) return;
  press.paint.done.add(i);
  const v = press.paint.value, cur = G.st[i];
  if (v === GRASS ? cur === U : cur === GRASS) { setCell(i, v); press.paint.changed = true; render(); }
}

svg.addEventListener('pointerdown', (ev) => {
  if (!G.st || modalOpen()) return;
  const mouse = ev.pointerType === 'mouse';
  try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* 무시 */ }
  if (mouse && ev.button === 1) { ev.preventDefault(); startPan(ev); return; }   // 가운데 버튼: 이동
  if (!mouse) {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ptrs.size >= 2 || pinch) {                  // 두 번째 손가락: 칠하던 것 되돌리고 확대/이동으로
      ev.preventDefault();
      if (press && press.paint && press.paint.changed) { undo(); }
      cancelPress(); pinchBase(); return;
    }
  }
  const h = hitAt(ev);
  if (typeof h === 'object') {                      // 줄 숫자
    ev.preventDefault();
    if (!mouse || ev.button === 0) fillLine('row' in h, 'row' in h ? h.row : h.col);
    return;
  }
  const i = h;
  if (mouse && ev.button === 2) { ev.preventDefault(); if (i >= 0) secondary(i); return; }
  if (mouse && ev.button !== 0) return;
  ev.preventDefault();
  press = { id: ev.pointerId, i, x: ev.clientX, y: ev.clientY, mouse, timer: null, paint: null };
  if (!G.over && i >= 0 && !G.tree[i]) setPress(i);
  if (!mouse) {
    press.timer = setTimeout(() => {         // 길게 누르기
      if (!press || press.paint) return;
      const pi = press.i;
      cancelPress();
      if (pi >= 0) secondary(pi);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 380);
  }
});
svg.addEventListener('pointermove', (ev) => {
  if (ptrs.has(ev.pointerId)) {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch) { pinchMove(); return; }
  }
  if (press && ev.pointerId === press.id) {
    if (!press.paint) {
      const d = Math.hypot(ev.clientX - press.x, ev.clientY - press.y);
      if (d < (press.mouse ? 6 : 10) || cellAt(ev) === press.i) return;
      if (G.over || press.i < 0 || G.tree[press.i]) { cancelPress(); return; }
      clearTimeout(press.timer);
      act();
      pushUndo();
      press.paint = { value: G.st[press.i] === GRASS ? U : GRASS, done: new Set(), changed: false,
        last: svgPoint({ clientX: press.x, clientY: press.y }) };
      setPress(-1);
      paintTo(press.i);
    }
    // 빠르게 끌면 이벤트 사이에 칸을 건너뛰므로, 지난 위치부터 지금 위치까지 선을 따라 칠한다
    const a = press.paint.last, b = svgPoint(ev);
    if (a && b) {
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL / 4));
      for (let k = 1; k <= steps; k++) {
        const x = a.x + (b.x - a.x) * k / steps, y = a.y + (b.y - a.y) * k / steps;
        const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
        if (r >= 0 && r < G.R && c >= 0 && c < G.C) paintTo(r * G.C + c);
      }
      press.paint.last = b;
    }
    return;
  }
  if (ev.pointerType === 'mouse' && !G.over) setHover(cellAt(ev));
});
function finishPointer(ev) {
  ptrs.delete(ev.pointerId);
  if (pinch) {
    if (ptrs.size) pinchBase(); else pinch = null;
    return;
  }
  if (press && ev.pointerId === press.id) {
    const p = press;
    cancelPress();
    if (p.paint) {
      if (!p.paint.changed) G.undo.pop();   // 아무것도 안 바뀐 끌기는 되돌리기 목록에서 뺀다
      afterChange();
    } else if (ev.type === 'pointerup' && p.i >= 0) primary(p.i);
  }
}
svg.addEventListener('pointerup', finishPointer);
svg.addEventListener('pointercancel', finishPointer);
svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') setHover(-1); });
svg.addEventListener('contextmenu', (ev) => ev.preventDefault());
svg.addEventListener('mousedown', (ev) => { if (ev.button === 1) ev.preventDefault(); });
svg.addEventListener('auxclick', (ev) => { if (ev.button === 1) ev.preventDefault(); });
svg.addEventListener('wheel', (ev) => {
  if (!G.st) return;
  ev.preventDefault();
  const dy = ev.deltaY * (ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? 400 : 1);
  zoomAt(ev.clientX, ev.clientY, Math.exp(-dy * (ev.ctrlKey ? 0.01 : 0.0025)));
}, { passive: false });

/* ───────── 공유 ───────── */
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

/* 공유 링크는 쿼리 문자열(?p=…&t=…&d=…)로 만든다. ('#' 뒤는 일부 앱에서 잘릴 수 있어서) */
function shareUrl(withTime) {
  let q = `?p=${encodePuzzle(puzzle())}`;
  if (withTime) q += `&t=${Math.floor(elapsed())}`;
  if (G.daily) q += `&d=${G.daily}`;
  return location.origin + location.pathname + q;
}

/* ───────── 공유 이미지 (캔버스로 그리기) ───────── */
const IMG = { text: '#1B1E2E', sub: '#6E7491', card: '#FFFFFF', chip: '#E2E6F1', tile: '#DCE1EE', open: '#F4F5FA',
  grass: '#DDF3E4', tree: '#16A34A', trunk: '#92400E', tent: '#F97316', door: '#7C2D12', win: '#10B981', accent: '#5B5BF0' };
const IMG_FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", "Malgun Gothic", sans-serif';

function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}
function drawTree(x, px, py, s) {
  x.fillStyle = IMG.trunk; roundRect(x, px + s * 0.44, py + s * 0.56, s * 0.12, s * 0.3, s * 0.05); x.fill();
  x.fillStyle = IMG.tree;
  for (const [cx, cy, r] of [[0.5, 0.4, 0.26], [0.33, 0.56, 0.16], [0.67, 0.56, 0.16]]) {
    x.beginPath(); x.arc(px + s * cx, py + s * cy, s * r, 0, Math.PI * 2); x.fill();
  }
}
function drawTent(x, px, py, s) {
  x.fillStyle = IMG.tent;
  x.beginPath(); x.moveTo(px + s * 0.5, py + s * 0.16); x.lineTo(px + s * 0.12, py + s * 0.84); x.lineTo(px + s * 0.88, py + s * 0.84);
  x.closePath(); x.fill();
  x.fillStyle = IMG.door;
  x.beginPath(); x.moveTo(px + s * 0.5, py + s * 0.46); x.lineTo(px + s * 0.37, py + s * 0.84); x.lineTo(px + s * 0.63, py + s * 0.84);
  x.closePath(); x.fill();
}

/* brag: 다 푼 판(텐트까지) · 아니면 나무와 숫자만 있는 처음 모습 */
function renderShareImage(brag) {
  const W = 800, c = document.createElement('canvas');
  c.width = W; c.height = W;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, W, W);
  grad.addColorStop(0, '#EEF1F8'); grad.addColorStop(1, '#E1F3E8');
  x.fillStyle = grad; x.fillRect(0, 0, W, W);

  // 머리글
  x.fillStyle = IMG.text; x.textBaseline = 'middle';
  x.font = `800 44px ${IMG_FONT}`;
  x.fillText('Tents', 60, 76);
  const tag = G.daily ? `오늘의 퍼즐 · ${dayLabel(G.daily)}` : `${G.level} · ${G.C}×${G.R}`;
  x.font = `700 26px ${IMG_FONT}`;
  const tw = x.measureText(tag).width + 40;
  x.fillStyle = IMG.chip; roundRect(x, W - 60 - tw, 52, tw, 48, 24); x.fill();
  x.fillStyle = IMG.text; x.textAlign = 'center'; x.fillText(tag, W - 60 - tw / 2, 77); x.textAlign = 'left';

  // 판 (위·왼쪽에 숫자)
  const pad = 22, clueK = 0.8;
  const cs = Math.min((680 - pad * 2) / (G.C + clueK), (540 - pad * 2) / (G.R + clueK));
  const bw = (G.C + clueK) * cs + pad * 2, bh = (G.R + clueK) * cs + pad * 2, bx = (W - bw) / 2, by = 130 + (540 - bh) / 2;
  x.save(); x.shadowColor = 'rgba(42,51,88,.14)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
  x.fillStyle = IMG.card; roundRect(x, bx, by, bw, bh, 28); x.fill(); x.restore();
  const ox = bx + pad + clueK * cs, oy = by + pad + clueK * cs, gap = Math.max(1, cs * 0.05), rr = cs * 0.16;
  x.textAlign = 'center'; x.fillStyle = IMG.text;
  x.font = `800 ${Math.round(cs * 0.5)}px "Segoe UI", ${IMG_FONT}`;
  for (let r = 0; r < G.R; r++) x.fillText(String(G.rows[r]), ox - clueK * cs / 2, oy + r * cs + cs * 0.53);
  for (let k = 0; k < G.C; k++) x.fillText(String(G.cols[k]), ox + k * cs + cs / 2, oy - clueK * cs / 2 + cs * 0.03);
  for (let i = 0; i < n(); i++) {
    const px = ox + (i % G.C) * cs, py = oy + Math.floor(i / G.C) * cs;
    const tent = brag && G.solution[i] === TENT;
    x.fillStyle = G.tree[i] || (brag && !tent) ? IMG.grass : tent ? IMG.open : IMG.tile;
    roundRect(x, px + gap, py + gap, cs - gap * 2, cs - gap * 2, rr); x.fill();
    if (G.tree[i]) drawTree(x, px, py, cs);
    else if (tent) drawTent(x, px, py, cs);
  }

  // 아래 문구
  if (brag) {
    x.fillStyle = IMG.win; x.font = `800 44px ${IMG_FONT}`;
    x.fillText(`✓ ${fmt(elapsed())} 만에 성공!${G.hints ? ` (힌트 ${G.hints})` : ''}`, W / 2, 735);
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
const OG_IMAGE = 'https://hy1116.github.io/tents/og-image.png';
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
  if (!G.st) return;
  brag = !!brag && G.won;
  const t = fmt(elapsed());
  const what = G.daily ? `오늘의 퍼즐(${dayLabel(G.daily)})` : G.level;
  const streak = brag && G.daily && !G.practice ? ` 🔥 ${stats.dailyStreaks(kstToday())[0]}일 연속!` : '';
  SH = {
    brag, url: shareUrl(brag),
    title: brag ? `텐트 ${what} — ${t} 성공!` : `텐트 ${what}`,
    text: brag ? `텐트 퍼즐 ${what}을 ${t}에 풀었어요!${streak} 나보다 빨리 풀 수 있어요? ⛺`
      : `텐트 퍼즐 ${what} 같이 풀어요 ⛺`,
    canvas: renderShareImage(brag), blob: null, kakaoImage: null,
  };
  $('share-title').textContent = brag ? '자랑하기' : '이 퍼즐 공유하기';
  $('share-msg').textContent = brag ? `${t} 기록이 담긴 도전 링크를 보내요. 친구가 열면 내 기록과 비교돼요.`
    : '친구가 링크를 열면 똑같은 퍼즐이 열려요.';
  $('share-preview').src = SH.canvas.toDataURL('image/png');
  $('share-more').hidden = !navigator.share;
  openModal('share');

  // 카카오톡을 누르는 순간 바로 열리도록 미리 준비 (SDK + 이미지 업로드)
  const cur = SH;
  new Promise((res) => cur.canvas.toBlob(res, 'image/png')).then((blob) => {
    cur.blob = blob;
    return loadKakao().then((K) => K.Share.uploadImage({ file: [new File([blob], 'tents.png', { type: 'image/png' })] }));
  }).then((r) => { cur.kakaoImage = r.infos.original; }).catch(() => { /* 실패하면 기본 이미지 사용 */ });
}

function kakaoPayload(sh) {
  const link = { mobileWebUrl: sh.url, webUrl: sh.url };
  const button = sh.brag ? '도전하기' : '같이 풀기';
  const img = sh.kakaoImage || { url: OG_IMAGE, width: 1200, height: 630 };
  return {
    objectType: 'feed',
    content: {
      title: sh.title,
      description: sh.brag ? '나보다 빨리 풀 수 있어요? 같은 퍼즐로 도전해 보세요!' : '나무 옆에 텐트를 하나씩. 같은 퍼즐로 같이 풀어요!',
      imageUrl: img.url, imageWidth: img.width, imageHeight: img.height, link,
    },
    buttons: [{ title: button, link }],
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
  const sh = SH, data = { title: 'Tents', text: sh.text, url: sh.url };
  if (sh.brag && sh.blob) {                     // 자랑하기: 이미지도 함께 (지원하는 기기만)
    const file = new File([sh.blob], 'tents.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
  }
  try { await navigator.share(data); closeModal('share'); } catch (e) {
    if (e && e.name !== 'AbortError') toast('공유하지 못했어요');
  }
}

function shareSave() {
  const a = document.createElement('a');
  a.href = SH.canvas.toDataURL('image/png');
  a.download = SH.brag ? `tents-${G.C}x${G.R}-${fmt(elapsed()).replace(/:/g, '')}.png` : 'tents-puzzle.png';
  document.body.appendChild(a); a.click(); a.remove();
  toast('이미지를 저장했어요');
}

/* 공유 링크로 들어왔을 때: ?p=<퍼즐 코드>&t=<친구 기록(초)>&d=<오늘의 퍼즐 날짜> */
function handleShareLink() {
  const q = new URLSearchParams(location.search);
  if (!q.has('p') && !q.has('d')) return false;
  history.replaceState(null, '', location.pathname);   // 새로고침 때 다시 열리지 않게
  const t = Number(q.get('t'));
  const challenge = q.has('t') && Number.isInteger(t) && t >= 0 && t < 360000 ? { time: t } : null;
  const d = q.get('d');
  // 오늘 날짜의 '오늘의 퍼즐' 링크면 → 진짜 오늘의 퍼즐로 (기록도 오늘의 퍼즐로 남음)
  if (d === kstToday()) { requestDaily(challenge); return true; }
  const p = decodePuzzle(q.get('p'));
  if (!p) { toast('잘못된 공유 링크예요'); return false; }
  const go = () => {
    G.level = p.level; G.daily = null;
    savePrefs();
    newGame({ puzzle: p, challenge });
    toast(challenge ? `친구 기록 ${fmt(challenge.time)}에 도전!` : '공유받은 퍼즐을 열었어요');
  };
  if (hasProgress()) {
    openConfirm('공유받은 퍼즐을 열까요?', '지금 풀던 퍼즐은 \'포기\'로 기록돼요.', '열기', () => { record(QUIT); go(); });
  } else go();
  return true;
}

/* ───────── 모달 ───────── */
const MODALS = ['confirm', 'share', 'stats', 'help'];   // 확인 창이 가장 위
const isOpen = (id) => !$(id).hidden;
const modalOpen = () => MODALS.some(isOpen);
let confirmAction = null;
function openModal(id) { $(id).hidden = false; setHover(-1); }
function closeModal(id) { $(id).hidden = true; }
function openConfirm(title, msg, ok, action, danger = false) {
  $('confirm-title').textContent = title;
  $('confirm-msg').textContent = msg;
  $('confirm-ok').textContent = ok;
  $('confirm-ok').classList.toggle('danger', danger);
  confirmAction = action;
  openModal('confirm');
}
function confirmOk() {
  closeModal('confirm');
  const a = confirmAction;
  confirmAction = null;
  if (a) a();
}
/* 진행 중이면 확인 후 새 퍼즐 */
function requestNewGame(before = null, title = '새 퍼즐을 시작할까요?') {
  const go = () => {
    if (before) before();
    else if (G.daily) G.level = LEVEL_NAMES.includes(prefs.level) ? prefs.level : '쉬움';   // 오늘의 퍼즐 뒤엔 원래 난이도로
    G.daily = null;
    savePrefs(); newGame();
  };
  if (!hasProgress()) { go(); return; }
  openConfirm(title, '지금 풀던 퍼즐은 \'포기\'로 기록돼요.', '새 퍼즐', () => { record(QUIT); go(); });
}

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
LEVEL_NAMES.forEach((name) => {
  const L = LEVELS[name], b = document.createElement('button');
  b.innerHTML = `${name} <small>· ${L.C}×${L.R}</small>`;
  b.title = `${L.C}×${L.R} · 나무 ${L.T}그루`;
  b.addEventListener('click', () => {
    if (name === G.level && !G.daily && playing()) return;
    requestNewGame(() => { G.level = name; }, `${name}(으)로 바꿀까요?`);
  });
  $('seg-level').appendChild(b);
});
$('seg-mode').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => { G.mode = Number(b.dataset.mode); render(); }));
$('btn-new').addEventListener('click', () => requestNewGame());
$('btn-again').addEventListener('click', () => requestNewGame());
$('btn-undo').addEventListener('click', undo);
$('btn-reset').addEventListener('click', resetBoard);
$('btn-hint').addEventListener('click', giveHint);
$('btn-help').addEventListener('click', () => openModal('help'));
$('btn-stats').addEventListener('click', openStats);
$('btn-daily').addEventListener('click', () => requestDaily());
$('btn-share').addEventListener('click', () => openShare(false));
$('btn-share-win').addEventListener('click', () => openShare(true));
$('share-kakao').addEventListener('click', shareKakao);
$('share-copy').addEventListener('click', shareCopy);
$('share-more').addEventListener('click', shareMore);
$('share-save').addEventListener('click', shareSave);
$('seg-stab').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => { statsTab = Number(b.dataset.tab); renderStats(); }));
$('btn-clear-stats').addEventListener('click', () => openConfirm('통계를 초기화할까요?',
  '모든 기록이 삭제되고 되돌릴 수 없어요.', '초기화', () => { stats.clear(); renderStats(); render(); }, true));
$('btn-theme').addEventListener('click', toggleTheme);
$('zoom-reset').addEventListener('click', resetZoom);
$('zoom-in').addEventListener('click', () => zoomCenter(1.5));
$('zoom-out').addEventListener('click', () => zoomCenter(1 / 1.5));
$('confirm-ok').addEventListener('click', confirmOk);
$('confirm-cancel').addEventListener('click', () => closeModal('confirm'));
for (const id of MODALS) {
  $(id).addEventListener('click', (ev) => { if (ev.target === $(id)) closeModal(id); });
  $(id).querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeModal(id)));
}
/* 결과 카드 바깥을 누르면 닫고 판을 볼 수 있게 (마지막 탭의 늦은 click 은 무시) */
let overPressed = false;
$('over').addEventListener('pointerdown', (ev) => { overPressed = ev.target === $('over'); });
$('over').addEventListener('click', (ev) => {
  if (ev.target === $('over') && overPressed) { G.overlayHidden = true; render(); }
  overPressed = false;
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { for (const id of MODALS) if (isOpen(id)) { closeModal(id); return; } return; }
  if (isOpen('confirm')) { if (ev.key === 'Enter') { ev.preventDefault(); confirmOk(); } return; }
  if (modalOpen()) return;
  if ((ev.ctrlKey || ev.metaKey) && ev.code === 'KeyZ') { ev.preventDefault(); undo(); return; }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.code === 'KeyN') requestNewGame();
  else if (ev.code === 'KeyD') toggleTheme();
  else if (ev.code === 'KeyS') openStats();
  else if (ev.code === 'KeyU') undo();
  else if (ev.code === 'KeyH') giveHint();
  else if (ev.code === 'KeyR') resetBoard();
  else if (ev.key === '+' || ev.key === '=') zoomCenter(1.25);
  else if (ev.key === '-' || ev.key === '_') zoomCenter(1 / 1.25);
  else if (ev.key === '0') resetZoom();
});

/* iOS: 두 번 탭 확대 / 두 손가락 페이지 확대 막기 */
let lastTouchEnd = 0;
document.addEventListener('touchend', (ev) => {
  const now = Date.now();
  if (now - lastTouchEnd < 350 && !ev.target.closest('button, a, input, textarea')) ev.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
document.addEventListener('gesturestart', (ev) => ev.preventDefault());
document.addEventListener('dblclick', (ev) => ev.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseClock(); saveGame(); } else resumeClock();
});
window.addEventListener('pagehide', saveGame);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeColor);
matchMedia('(pointer: coarse)').addEventListener?.('change', render);

/* 오프라인 지원 · 앱으로 설치 (https 또는 localhost 에서만) */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* 시작 */
syncThemeColor();
const restored = restoreGame();
if (!handleShareLink() && !restored) newGame();
render();
