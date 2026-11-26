/* 지뢰찾기 웹 버전 — 화면 · 입력 · 게임 흐름 · 기록 */
'use strict';

const COVER = 0, OPEN = 1, FLAG = 2;
const M_OPEN = 0, M_FLAG = 1;             // 터치에서 '탭'이 할 일
const LEVEL_NAMES = Object.keys(LEVELS);
const CELL = 100, MARGIN = 14, INSET = 4;
const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/* ───────── 저장소 ───────── */
const K_PREFS = 'mines.prefs.v1', K_STATS = 'mines.stats.v1', K_GAME = 'mines.game.v1';
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

const prefs = store.get(K_PREFS, {});
const stats = store.get(K_STATS, {});      // { 초급: { played, won, best } … }
const statOf = (lv) => (stats[lv] ||= { played: 0, won: 0, best: null });
function savePrefs() {
  store.set(K_PREFS, { level: G.level, theme: document.documentElement.dataset.theme || null });
}

/* ───────── 게임 상태 ───────── */
const G = {
  level: LEVEL_NAMES.includes(prefs.level) ? prefs.level : '초급',
  R: 9, C: 9, M: 10,
  mines: null, num: null,               // 첫 칸을 연 뒤에 만들어짐
  state: null, opened: 0, flags: 0,
  over: false, won: false, boom: -1,    // boom: 밟은 지뢰 칸
  prev: null,                           // 실수 되돌리기용 (마지막 동작 직전 상태)
  rescued: false, newBest: false, prevBest: null,
  acc: 0, since: null, mode: M_OPEN, hover: -1, overlayHidden: false,
};
const n = () => G.R * G.C;
const started = () => !!G.mines;
const playing = () => started() && !G.over;

/* ───────── 시계 ───────── */
const elapsed = () => (G.acc + (G.since !== null ? Date.now() - G.since : 0)) / 1000;
function pauseClock() { if (G.since !== null) { G.acc += Date.now() - G.since; G.since = null; } }
function resumeClock() { if (G.since === null && playing() && !document.hidden) G.since = Date.now(); }
setInterval(() => { $('timer').textContent = fmt(elapsed()); }, 250);

/* ───────── 저장 / 복원 (새로고침해도 이어서) ───────── */
function saveGame() {
  if (!playing()) { store.del(K_GAME); return; }
  store.set(K_GAME, { level: G.level, R: G.R, C: G.C, M: G.M, mines: Array.from(G.mines),
    state: Array.from(G.state), elapsed: elapsed(), rescued: G.rescued });
}
function restoreGame() {
  const s = store.get(K_GAME, null);
  if (!s || !LEVELS[s.level]) return false;
  const N = s.R * s.C;
  if (!Array.isArray(s.mines) || s.mines.length !== N || !Array.isArray(s.state) || s.state.length !== N) return false;
  G.level = s.level; G.R = s.R; G.C = s.C; G.M = s.M;
  G.mines = Uint8Array.from(s.mines);
  G.num = countNumbers(G.R, G.C, G.mines);
  G.state = Uint8Array.from(s.state);
  G.opened = G.state.filter((v) => v === OPEN).length;
  G.flags = G.state.filter((v) => v === FLAG).length;
  G.over = G.won = false; G.boom = -1; G.prev = null; G.rescued = !!s.rescued;
  G.acc = (s.elapsed || 0) * 1000; G.since = null;
  buildBoard();
  resumeClock();
  return true;
}

/* ───────── 새 게임 ───────── */
function newGame() {
  const L = LEVELS[G.level];
  // 고급은 화면이 가로로 넓으면 30열 × 16행으로 돌려서
  const landscape = innerWidth > innerHeight && L.R !== L.C;
  G.R = landscape ? L.C : L.R; G.C = landscape ? L.R : L.C; G.M = L.M;
  G.mines = G.num = null;
  G.state = new Uint8Array(n());
  G.opened = G.flags = 0;
  G.over = G.won = false; G.boom = -1; G.prev = null;
  G.rescued = G.newBest = false; G.prevBest = null; G.overlayHidden = false;
  G.acc = 0; G.since = null; G.hover = -1;
  store.del(K_GAME);
  buildBoard();
  render();
}

function startAt(i) {                     // 첫 칸: 이 칸 주변은 비워 두고, 찍기 없이 풀리는 판을 만든다
  const b = generateBoard(G.R, G.C, G.M, i);
  G.mines = Uint8Array.from(b.mines);
  G.num = countNumbers(G.R, G.C, G.mines);
  statOf(G.level).played++;
  store.set(K_STATS, stats);
  resumeClock();
}

/* ───────── 동작 ───────── */
function flood(i0) {                       // 0 이면 주변까지 연쇄로 연다
  const nb = neighbors(G.R, G.C), stack = [i0];
  G.state[i0] = OPEN; G.opened++;
  while (stack.length) {
    const i = stack.pop();
    if (G.num[i] !== 0) continue;
    for (const j of nb[i]) if (G.state[j] === COVER) { G.state[j] = OPEN; G.opened++; stack.push(j); }
  }
}
function openCells(list) {                 // 지뢰를 밟으면 true
  for (const i of list) {
    if (G.state[i] !== COVER) continue;
    if (G.mines[i]) { lose(i); return true; }
    flood(i);
  }
  return false;
}
function openCell(i) {
  if (G.state[i] !== COVER) return;
  if (!started()) startAt(i);
  G.prev = snapshot();
  if (!openCells([i])) checkWin();
  afterChange();
}
/* 열린 숫자 칸: 주변 깃발 수가 숫자와 같으면 나머지를 한 번에 연다 (모바일의 '양쪽 클릭') */
function chord(i) {
  const nb = neighbors(G.R, G.C)[i];
  const covered = nb.filter((j) => G.state[j] === COVER);
  if (!G.num[i] || !covered.length) return;
  const f = nb.filter((j) => G.state[j] === FLAG).length;
  if (f !== G.num[i]) { flash(covered); return; }
  G.prev = snapshot();
  if (!openCells(covered)) checkWin();
  afterChange();
}
function toggleFlag(i) {
  if (!started() || G.state[i] === OPEN) return;
  G.state[i] = G.state[i] === FLAG ? COVER : FLAG;
  G.flags += G.state[i] === FLAG ? 1 : -1;
  if (navigator.vibrate && isTouch()) navigator.vibrate(10);
  afterChange();
}
function afterChange() { saveGame(); render(); }

/* 탭(왼쪽 클릭) / 길게 누르기(오른쪽 클릭) */
function primary(i) {
  if (G.over || i < 0) return;
  if (G.state[i] === OPEN) chord(i);
  else if (!started()) openCell(i);                          // 첫 탭은 항상 열기
  else if (G.mode === M_FLAG && isTouch()) toggleFlag(i);
  else if (G.state[i] === COVER) openCell(i);
}
function secondary(i) {
  if (G.over || i < 0) return;
  if (G.state[i] === OPEN) chord(i);
  else if (G.mode === M_FLAG && isTouch()) { if (G.state[i] === COVER) openCell(i); }
  else toggleFlag(i);
}

let flashTimer = null, flashCells = [];
function flash(list) {                     // 깃발 수가 안 맞을 때: 주변 칸을 잠깐 눌린 모양으로
  flashCells = list;
  renderBoard();
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashCells = []; renderBoard(); }, 260);
}

const snapshot = () => ({ state: G.state.slice(), opened: G.opened, flags: G.flags });

function checkWin() {
  if (G.opened !== n() - G.M) return;
  pauseClock();
  G.over = G.won = true;
  for (let i = 0; i < n(); i++) if (G.mines[i] && G.state[i] !== FLAG) { G.state[i] = FLAG; G.flags++; }
  const st = statOf(G.level), t = Math.floor(elapsed());
  G.prevBest = st.best;
  st.won++;
  G.newBest = !G.rescued && (st.best === null || t < st.best);
  if (G.newBest) st.best = t;
  store.set(K_STATS, stats);
  resetZoom();
}
function lose(i) {
  pauseClock();
  G.over = true; G.won = false; G.boom = i;
  if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
}
function rescue() {                        // 실수 되돌리기: 밟기 직전으로 (최고 기록에서는 제외)
  if (!G.over || G.won || !G.prev) return;
  Object.assign(G, G.prev);
  G.state = G.prev.state.slice();
  G.over = false; G.boom = -1; G.rescued = true; G.overlayHidden = false;
  resumeClock();
  afterChange();
}

/* ───────── 판 (SVG) ───────── */
const svg = $('board');
let cellEls = [], drawn = [];

function mk(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

function buildBoard() {
  const R = G.R, C = G.C;
  $('board-card').style.setProperty('--ar', `${C * CELL + 2 * MARGIN} / ${R * CELL + 2 * MARGIN}`);
  document.querySelector('.app').classList.toggle('wide', C > R);
  Z.full = { x: -MARGIN, y: -MARGIN, w: C * CELL + 2 * MARGIN, h: R * CELL + 2 * MARGIN };
  cancelAnimationFrame(Z.anim);
  applyView(Z.full.x, Z.full.y, Z.full.w);
  [...svg.querySelectorAll('g.cells')].forEach((g) => g.remove());
  const root = mk('g', { class: 'cells' }, svg);
  cellEls = []; drawn = [];
  for (let i = 0; i < R * C; i++) {
    const x = (i % C) * CELL, y = Math.floor(i / C) * CELL;
    const g = mk('g', { class: 'c', transform: `translate(${x} ${y})` }, root);
    mk('rect', { class: 't', x: INSET, y: INSET, width: CELL - 2 * INSET, height: CELL - 2 * INSET, rx: 16 }, g);
    const t = mk('text', { class: 'n', x: CELL / 2, y: CELL / 2 + 2 }, g);
    const u = mk('use', { x: 14, y: 14, width: 72, height: 72 }, g);
    cellEls.push({ g, t, u, x: null });
    drawn.push('');
  }
  svg.classList.add('fresh');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('fresh')));
}

function cellLook(i) {                     // [class, 숫자, 아이콘, X표시]
  const st = G.state[i], over = G.over && !G.won;
  const mine = started() && G.mines[i];
  let cls = 'c', txt = '', icon = '', cross = false;
  if (st === OPEN) {
    cls += ' open';
    if (G.num[i] > 0) { cls += ` n${G.num[i]}`; txt = String(G.num[i]); }
  } else if (st === FLAG) {
    cls += ' flag'; icon = 'flag';
    if (over && !mine) { cls += ' wrong'; cross = true; }   // 잘못 꽂은 깃발
  } else if (over && mine) {
    cls += i === G.boom ? ' boom open' : ' mine open';
    icon = 'mine';
  }
  if (st !== OPEN && !G.over) {
    if (i === G.hover) cls += ' hover';
    if (i === pressCell || flashCells.includes(i)) cls += ' press';
  }
  return [cls, txt, icon, cross];
}

function renderBoard() {
  svg.classList.toggle('won', G.won);
  for (let i = 0; i < cellEls.length; i++) {
    const look = cellLook(i), key = look.join('|');
    if (key === drawn[i]) continue;
    drawn[i] = key;
    const el = cellEls[i];
    el.g.setAttribute('class', look[0]);
    el.t.textContent = look[1];
    if (look[2]) el.u.setAttribute('href', `#i-${look[2]}`); else el.u.removeAttribute('href');
    if (look[3] && !el.x) el.x = mk('path', { class: 'x', d: 'M22 22L78 78M78 22L22 78' }, el.g);
    if (!look[3] && el.x) { el.x.remove(); el.x = null; }
  }
}

/* ───────── 화면 갱신 ───────── */
function render() {
  [...$('seg-level').children].forEach((b, i) => b.classList.toggle('on', LEVEL_NAMES[i] === G.level));
  [...$('seg-mode').children].forEach((b, i) => b.classList.toggle('on', i === G.mode));
  $('left').textContent = G.M - G.flags;
  $('timer').textContent = fmt(elapsed());

  const st = $('status'), best = statOf(G.level).best;
  st.classList.toggle('win-text', G.won);
  st.classList.toggle('lose-text', G.over && !G.won);
  if (G.won) st.textContent = `성공!  기록 ${fmt(elapsed())}`;
  else if (G.over) st.textContent = '지뢰를 밟았어요';
  else if (!started()) st.textContent = `아무 칸이나 눌러 시작하세요${best !== null ? `  ·  최고 기록 ${fmt(best)}` : ''}`;
  else if (G.rescued) st.textContent = '되돌린 판이라 기록은 최고 기록에서 빠져요';
  else st.textContent = isTouch()
    ? (G.mode === M_FLAG ? '탭: 깃발   ·   길게 누르기: 열기' : '탭: 열기   ·   길게 누르기: 깃발')
    : '왼쪽 클릭: 열기   ·   오른쪽 클릭: 깃발   ·   숫자 클릭: 주변 열기';

  const show = G.over && !G.overlayHidden;
  $('over').hidden = !show;
  if (show) {
    const badge = $('over-badge');
    badge.className = `badge${G.won ? '' : ' lose'}`;
    badge.textContent = G.won ? '✓' : '💥';
    $('over-title').textContent = G.won ? '성공!' : '펑!';
    const what = `${G.level} · ${G.C}×${G.R} · 지뢰 ${G.M}개`;
    $('over-meta').textContent = G.won ? `${what} · ${fmt(elapsed())}` : what;
    const b = $('over-best');
    b.classList.toggle('new', G.won && G.newBest);
    if (!G.won) b.textContent = '찍을 필요 없는 판이었어요. 다시 한번 따져 볼까요?';
    else if (G.newBest) b.textContent = '★  최고 기록 달성!';
    else if (G.rescued) b.textContent = '되돌린 판이라 최고 기록에서 빠져요';
    else b.textContent = `최고 기록 ${fmt(G.prevBest)}`;
    $('btn-rescue').hidden = G.won || !G.prev;
    $('btn-again').textContent = G.won ? '다음 판 →' : '새 게임';
  }
  renderBoard();
}

/* ───────── 확대 · 이동 (슬리더 링크와 같은 방식: viewBox 를 바꾼다) ───────── */
const Z = { full: null, view: null, anim: 0 };
const maxZoom = () => Math.max(1.6, Math.min(G.R, G.C) / 5);      // 한 화면에 최소 5칸쯤 보이게
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
 * 탭 = 열기(또는 깃발 모드면 깃발), 길게 누르기 = 반대 동작, 열린 숫자 탭 = 주변 한 번에 열기.
 * 확대한 상태에서 끌면 판 이동. 두 손가락은 확대/이동. */
let press = null, pressCell = -1;          // { id, i, x, y, timer, mouse }

function cellAt(ev) {
  if (!G.state) return -1;
  const m = svg.getScreenCTM();
  if (!m) return -1;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const p = pt.matrixTransform(m.inverse());
  const c = Math.floor(p.x / CELL), r = Math.floor(p.y / CELL);
  return r >= 0 && r < G.R && c >= 0 && c < G.C ? r * G.C + c : -1;
}
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

svg.addEventListener('pointerdown', (ev) => {
  if (!G.state || modalOpen()) return;
  const mouse = ev.pointerType === 'mouse';
  try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* 무시 */ }
  if (mouse && ev.button === 1) { ev.preventDefault(); startPan(ev); return; }   // 가운데 버튼: 이동
  if (!mouse) {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ptrs.size >= 2 || pinch) { ev.preventDefault(); cancelPress(); pinchBase(); return; }
  }
  const i = cellAt(ev);
  if (mouse && ev.button === 2) { ev.preventDefault(); secondary(i); return; }
  if (mouse && ev.button !== 0) return;
  ev.preventDefault();
  press = { id: ev.pointerId, i, x: ev.clientX, y: ev.clientY, mouse, timer: null };
  if (!G.over && i >= 0 && G.state[i] !== FLAG) setPress(i);
  if (!mouse) {
    press.timer = setTimeout(() => {         // 길게 누르기
      if (!press) return;
      const pi = press.i;
      cancelPress();
      secondary(pi);
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
    const d = Math.hypot(ev.clientX - press.x, ev.clientY - press.y);
    if (d > (press.mouse ? 6 : 10)) {
      if (zoomLevel() > 1.01) {                // 확대 상태: 끌면 이동
        const start = { clientX: press.x, clientY: press.y, pointerId: ev.pointerId };
        startPan(start);
        ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        pinchMove();
      } else if (cellAt(ev) !== press.i) cancelPress();   // 다른 칸으로 미끄러지면 취소
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
    const pi = press.i;
    cancelPress();
    if (ev.type === 'pointerup') primary(pi);
  }
}
svg.addEventListener('pointerup', finishPointer);
svg.addEventListener('pointercancel', finishPointer);
svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') setHover(-1); });
svg.addEventListener('contextmenu', (ev) => ev.preventDefault());
svg.addEventListener('mousedown', (ev) => { if (ev.button === 1) ev.preventDefault(); });
svg.addEventListener('auxclick', (ev) => { if (ev.button === 1) ev.preventDefault(); });
svg.addEventListener('wheel', (ev) => {
  if (!G.state) return;
  ev.preventDefault();
  const dy = ev.deltaY * (ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? 400 : 1);
  zoomAt(ev.clientX, ev.clientY, Math.exp(-dy * (ev.ctrlKey ? 0.01 : 0.0025)));
}, { passive: false });

/* ───────── 모달 ───────── */
const MODALS = ['confirm', 'help'];
const isOpen = (id) => !$(id).hidden;
const modalOpen = () => MODALS.some(isOpen);
let confirmAction = null;
function openModal(id) { $(id).hidden = false; setHover(-1); }
function closeModal(id) { $(id).hidden = true; }
function openConfirm(title, msg, ok, action) {
  $('confirm-title').textContent = title;
  $('confirm-msg').textContent = msg;
  $('confirm-ok').textContent = ok;
  confirmAction = action;
  openModal('confirm');
}
function confirmOk() {
  closeModal('confirm');
  const a = confirmAction;
  confirmAction = null;
  if (a) a();
}
/* 진행 중이면 확인 후 새 게임 */
function requestNewGame(before = null, title = '새 게임을 시작할까요?') {
  const go = () => { if (before) before(); savePrefs(); newGame(); };
  if (!playing() || G.opened === 0) { go(); return; }
  openConfirm(title, '지금 풀던 판은 사라져요.', '새 게임', go);
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
  b.innerHTML = `${name} <small>· ${L.M}</small>`;
  b.title = `${L.C}×${L.R} · 지뢰 ${L.M}개`;
  b.addEventListener('click', () => {
    if (name === G.level && !G.over && playing()) return;
    requestNewGame(() => { G.level = name; }, `${name}(으)로 바꿀까요?`);
  });
  $('seg-level').appendChild(b);
});
$('seg-mode').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => { G.mode = Number(b.dataset.mode); render(); }));
$('btn-new').addEventListener('click', () => requestNewGame());
$('btn-again').addEventListener('click', () => requestNewGame());
$('btn-rescue').addEventListener('click', rescue);
$('btn-help').addEventListener('click', () => openModal('help'));
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
  if (modalOpen() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.code === 'KeyN') requestNewGame();
  else if (ev.code === 'KeyD') toggleTheme();
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

/* 시작 */
syncThemeColor();
if (!restoreGame()) newGame();
render();
