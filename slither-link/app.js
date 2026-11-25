/* 슬리더 링크 웹 버전 — 화면 · 입력 · 게임 흐름 · 통계 */
'use strict';

const EMPTY = 0, LINE = 1, CROSS = 2;
const SIZES = [5, 7, 10];
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

/* ───────── 통계 (데스크톱 버전과 같은 형식) ───────── */
class Stats {
  constructor() {
    const d = store.get(K_STATS, {});
    this.games = Array.isArray(d.games) ? d.games.filter((g) => g && typeof g === 'object') : [];
  }
  save() { store.set(K_STATS, { version: 1, games: this.games }); }
  add(size, diff, secs, result, undo) {
    const n = new Date(), p = (x) => String(x).padStart(2, '0');
    this.games.push({
      date: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`,
      size, diff, time: Math.floor(secs), result, undo,
    });
    this.save();
  }
  clear() { this.games = []; this.save(); }
  summary(size = null, diff = null) {
    const gs = this.games.filter((g) => (size === null || g.size === size) && (diff === null || g.diff === diff));
    const won = gs.filter((g) => g.result === Stats.WIN).map((g) => g.time || 0);
    return {
      played: gs.length, won: won.length,
      rate: gs.length ? won.length / gs.length : null,
      best: won.length ? Math.min(...won) : null,
      avg: won.length ? won.reduce((a, b) => a + b, 0) / won.length : null,
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
    (s.elapsed || 0) * 1000, s.undoCount || 0);
  G.challenge = s.challenge && Number.isFinite(s.challenge.time) ? { time: s.challenge.time } : null;
  render();
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
  return { puzzle: generatePuzzle(msg.n, msg.n, msg.diff) };
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

function newGame() {
  if (G.generating) return;
  G.generating = true;
  G.grid = null; G.state = []; G.undo = []; G.redo = [];
  G.solved = G.won = G.revealed = G.overlayHidden = false;
  G.acc = 0; G.since = null; G.hover = -1; G.undoCount = 0; G.challenge = null;
  store.del(K_GAME);
  $('board').textContent = '';
  render();
  const id = ++G.genId;
  runJob({ type: 'gen', n: G.size, diff: G.diff }).then((r) => { if (id === G.genId) loadPuzzle(r.puzzle); });
}

function loadPuzzle(p, state = null, accMs = 0, undoCount = 0) {
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
let edgeEls = [], crossEls = [], clueEls = [], dotEls = [];

function mk(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent.appendChild(el);
  return el;
}

function buildBoard() {
  const g = G.grid, C = g.C, R = g.R;
  svg.setAttribute('viewBox', `${-MARGIN} ${-MARGIN} ${C * CELL + 2 * MARGIN} ${R * CELL + 2 * MARGIN}`);
  svg.textContent = '';
  const gClue = mk('g', {}, svg), gEdge = mk('g', {}, svg), gDot = mk('g', {}, svg);
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
  }
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

  const playing = running();
  $('t-undo').disabled = !(playing && G.undo.length);
  $('t-redo').disabled = !(playing && G.redo.length);
  $('t-cross').disabled = !playing;
  $('t-reset').disabled = !(playing && G.state.some((s) => s));
  renderReveal();

  const st = $('status');
  st.classList.toggle('win-text', G.won);
  st.classList.toggle('challenge', !!G.challenge && playing);
  if (G.generating) st.textContent = '퍼즐을 만드는 중…';
  else if (G.won) st.textContent = `완성!  기록 ${fmt(elapsed())}`;
  else if (G.revealed) st.textContent = '정답을 공개했어요 · 새 게임으로 다시 도전해 보세요';
  else if (G.challenge) st.textContent = `⚑ 친구 기록 ${fmt(G.challenge.time)}에 도전 중!`;
  else st.textContent = isTouch() ? '탭: 선   ·   길게 누르기: X 표시'
    : '왼쪽 클릭·드래그: 선    오른쪽 클릭: X 표시';

  $('spinner').hidden = !G.generating;
  const showWin = G.won && !G.overlayHidden;
  $('win').hidden = !showWin;
  if (showWin) {
    $('win-meta').textContent = `${G.size}×${G.size} · ${G.diff} · 기록 ${fmt(elapsed())}`;
    const b = $('win-best');
    b.classList.toggle('new', G.newBest);
    b.textContent = G.newBest ? '★  최고 기록 달성!' : `최고 기록 ${fmt(G.prevBest)}`;
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

setInterval(() => {
  $('timer').textContent = fmt(elapsed());
  if (running()) renderReveal();
}, 250);

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
function showSolution() {
  if (!running() || !revealReady()) return;
  pauseClock();
  G.state = G.solution.map((s) => (s ? LINE : EMPTY));
  G.solved = G.revealed = true;
  stats.add(G.size, G.diff, elapsed(), Stats.REVEAL, G.undoCount);
  store.del(K_GAME);
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
  G.newBest = G.prevBest === null || t < G.prevBest;
  stats.add(G.size, G.diff, t, Stats.WIN, G.undoCount);
  store.del(K_GAME);
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

svg.addEventListener('pointerdown', (ev) => {
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

/* ───────── 공유 ───────── */
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
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

function shareUrl(withTime) {
  let h = `#p=${encodePuzzle(G.size, G.diff, G.clues)}`;
  if (withTime) h += `&t=${Math.floor(elapsed())}`;
  return location.origin + location.pathname + h;
}

async function sharePuzzle(withTime) {
  if (!G.grid || G.generating) return;
  withTime = withTime && G.won;
  const url = shareUrl(withTime);
  const text = withTime
    ? `슬리더 링크 ${G.size}×${G.size} ${G.diff} 퍼즐을 ${fmt(elapsed())}에 풀었어요! 도전해 보세요 🧩`
    : `슬리더 링크 ${G.size}×${G.size} ${G.diff} 퍼즐 같이 풀어요 🧩`;
  if (navigator.share && isTouch()) {          // 휴대폰: 공유 시트 (카톡, 메시지 등)
    try { await navigator.share({ title: 'Slither Link', text, url }); return; } catch (e) {
      if (e && e.name === 'AbortError') return;  // 사용자가 닫음
    }
  }
  toast(await copyText(`${text}\n${url}`) ? '링크를 복사했어요' : '복사하지 못했어요');
}

/* 공유 링크로 들어왔을 때: #p=<퍼즐 코드>&t=<친구 기록(초)> */
function readShareHash() {
  if (!location.hash.startsWith('#p=')) return null;
  const q = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname + location.search);   // 새로고침 때 다시 열리지 않게
  const p = decodePuzzle(q.get('p'));
  if (!p || !SIZES.includes(p.n) || !DIFFS.includes(p.diff)) return { bad: true };
  const t = Number(q.get('t'));
  p.time = Number.isInteger(t) && t >= 0 && t < 360000 ? t : null;
  return p;
}

async function openShared(p) {
  const res = await runJob({ type: 'solve', n: p.n, clues: p.clues });
  if (res.count !== 1) return false;           // 답이 없거나 여러 개 → 잘못된 링크
  const go = () => {
    G.genId++;                                  // 만들던 퍼즐이 있으면 버림
    G.size = p.n; G.diff = p.diff; savePrefs();
    loadPuzzle({ R: p.n, C: p.n, clues: p.clues, solution: res.solution });
    G.challenge = p.time !== null ? { time: p.time } : null;
    saveGame(); render();
    toast(G.challenge ? `친구 기록 ${fmt(p.time)}에 도전!` : '공유받은 퍼즐을 열었어요');
  };
  if (hasProgress()) {
    openConfirm({
      title: '공유받은 퍼즐을 열까요?', msg: '지금 풀던 퍼즐은 \'포기\'로 기록돼요.', ok: '열기', icon: '↗',
      action: () => { stats.add(G.size, G.diff, elapsed(), Stats.QUIT, G.undoCount); go(); },
    });
  } else go();
  return true;
}

async function handleShareHash() {
  const p = readShareHash();
  if (!p) return false;
  if (p.bad || !(await openShared(p))) { toast('잘못된 공유 링크예요'); return false; }
  return true;
}

/* ───────── 모달 ───────── */
const MODALS = ['confirm', 'stats', 'help'];
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
      stats.add(G.size, G.diff, elapsed(), Stats.QUIT, G.undoCount);
      go();
    },
  });
}

/* ───────── 통계 창 ───────── */
function renderStats() {
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
          <td>${esc(g.size)}×${esc(g.size)}&nbsp; ${esc(g.diff)}</td><td>${fmt(g.time || 0)}</td>
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
buildSeg($('seg-size'), SIZES.map((n) => `${n} × ${n}`), (i) => {
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
$('btn-share').addEventListener('click', () => sharePuzzle(false));
$('btn-share-win').addEventListener('click', () => sharePuzzle(true));
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
  if (location.hash.startsWith('#p=')) {
    if (!restored) { G.generating = true; render(); }       // 확인하는 동안 로딩 표시
    const ok = await handleShareHash();
    if (!restored) G.generating = false;
    if (ok || restored) return;
  }
  if (!restored) newGame();
})();
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#p=') && !G.generating) handleShareHash();
});
