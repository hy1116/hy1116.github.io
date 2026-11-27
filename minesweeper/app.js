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
const K_PREFS = 'mines.prefs.v1', K_STATS = 'mines.stats.v2', K_GAME = 'mines.game.v1';
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

/* ───────── 날짜 (오늘의 게임은 한국 시간 기준) ───────── */
const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const addDays = (date, k) => new Date(Date.parse(date + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
const weekday = (date) => new Date(date + 'T00:00:00Z').getUTCDay();          // 0=일 … 6=토
const dayLabel = (date) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
const DAILY_SEED = 'mines-daily-v1:';        // 바꾸면 모든 날짜의 판이 바뀜
const dailyLevel = (date) => ([0, 6].includes(weekday(date)) ? '고급' : '중급');   // 주말은 고급

/* ───────── 기록 ───────── */
const WIN = '성공', LOSE = '실패', QUIT = '포기';
class Stats {
  constructor() {
    const d = store.get(K_STATS, {});
    this.games = Array.isArray(d.games) ? d.games.filter((g) => g && typeof g === 'object') : [];
  }
  save() { store.set(K_STATS, { version: 2, games: this.games }); }
  add(level, secs, result, extra = {}) {
    const t = new Date(), p = (x) => String(x).padStart(2, '0');
    const g = { date: `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`,
      level, time: Math.floor(secs), result };
    for (const k in extra) if (extra[k]) g[k] = extra[k];       // daily, rescued (있을 때만)
    this.games.push(g);
    this.save();
  }
  popLast(result) {                         // 실수 되돌리기: 방금 남긴 '실패' 기록을 지운다
    const last = this.games[this.games.length - 1];
    if (last && last.result === result) { this.games.pop(); this.save(); }
  }
  clear() { this.games = []; this.save(); }
  summary(level = null) {
    const gs = this.games.filter((g) => level === null || g.level === level);
    const won = gs.filter((g) => g.result === WIN);
    const clean = won.filter((g) => !g.rescued).map((g) => g.time || 0);   // 되돌린 판은 기록 제외
    return {
      played: gs.length, won: won.length,
      rate: gs.length ? won.length / gs.length : null,
      best: clean.length ? Math.min(...clean) : null,
      avg: clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null,
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
  if (G.practice) return;                   // 이미 완료한 오늘의 게임을 다시 풀 때는 기록 안 남김
  stats.add(G.level, elapsed(), result, { daily: G.daily, rescued: G.rescued });
}

const prefs = store.get(K_PREFS, {});
function savePrefs() {                     // 오늘의 게임 난이도는 평소 설정으로 저장하지 않는다
  if (!G.daily) prefs.level = G.level;
  store.set(K_PREFS, { level: prefs.level, theme: document.documentElement.dataset.theme || null });
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
  acted: false,                         // 한 번이라도 눌렀는지 (오늘의 게임은 미리 열린 채로 시작해서)
  daily: null, practice: false,         // 오늘의 게임이면 날짜 / 이미 완료한 날 다시 풀기
  start: null,                          // 첫 칸 (공유 링크로 같은 판을 같은 시작으로 보내려고)
  challenge: null,                      // 공유받은 기록 { time } — 이기면 비교
};
const n = () => G.R * G.C;
const started = () => !!G.mines;
const playing = () => started() && !G.over;

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
  store.set(K_GAME, { level: G.level, R: G.R, C: G.C, M: G.M, mines: Array.from(G.mines),
    state: Array.from(G.state), elapsed: elapsed(), rescued: G.rescued,
    acted: G.acted, daily: G.daily, practice: G.practice, start: G.start, challenge: G.challenge });
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
  G.acted = s.acted !== false;
  G.daily = typeof s.daily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.daily) ? s.daily : null;
  G.practice = !!s.practice;
  G.start = Number.isInteger(s.start) && s.start >= 0 && s.start < N ? s.start : null;
  G.challenge = s.challenge && Number.isFinite(s.challenge.time) ? { time: s.challenge.time } : null;
  buildBoard();
  resumeClock();
  return true;
}

/* ───────── 새 게임 ───────── */
/* opts: { daily, practice, board, challenge }
 * 오늘의 게임은 날짜 시드로 판과 시작 칸을 정하고, 공유받은 판(board)은 링크의 판을 쓴다. 둘 다 시작 칸을 미리 열어 둔다 */
function newGame(opts = {}) {
  const L = LEVELS[G.level];
  // 고급은 화면이 가로로 넓으면 30열 × 16행으로 돌려서 (오늘의 게임은 모두 같은 판이어야 하니 그대로)
  const landscape = !opts.daily && innerWidth > innerHeight && L.R !== L.C;
  G.R = landscape ? L.C : L.R; G.C = landscape ? L.R : L.C; G.M = L.M;
  if (opts.board) { G.R = opts.board.R; G.C = opts.board.C; }
  G.mines = G.num = null;
  G.state = new Uint8Array(n());
  G.opened = G.flags = 0;
  G.over = G.won = false; G.boom = -1; G.prev = null;
  G.rescued = G.newBest = false; G.prevBest = null; G.overlayHidden = false;
  G.acc = 0; G.since = null; G.hover = -1; G.acted = false;
  G.daily = opts.daily || null; G.practice = !!opts.practice;
  G.start = null; G.challenge = opts.challenge || null;
  store.del(K_GAME);
  buildBoard();
  const b = opts.board || (G.daily ? dailyBoard(G.R, G.C, G.M, DAILY_SEED + G.daily) : null);
  if (b) {
    G.start = b.start;
    G.mines = Uint8Array.from(b.mines);
    G.num = countNumbers(G.R, G.C, G.mines);
    flood(b.start);
    saveGame();
  }
  render();
}

function startAt(i) {                     // 첫 칸: 이 칸 주변은 비워 두고, 찍기 없이 풀리는 판을 만든다
  const b = generateBoard(G.R, G.C, G.M, i);
  G.start = i;
  G.mines = Uint8Array.from(b.mines);
  G.num = countNumbers(G.R, G.C, G.mines);
}
function act() {                           // 첫 동작에서 시계 시작
  if (!G.acted) { G.acted = true; resumeClock(); }
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
  act();
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
  act();
  G.prev = snapshot();
  if (!openCells(covered)) checkWin();
  afterChange();
}
function toggleFlag(i) {
  if (!started() || G.state[i] === OPEN) return;
  act();
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
  const t = Math.floor(elapsed());
  G.prevBest = stats.best(G.level);
  G.newBest = !G.rescued && !G.practice && (G.prevBest === null || t < G.prevBest);
  record(WIN);
  resetZoom();
}
function lose(i) {
  pauseClock();
  G.over = true; G.won = false; G.boom = i;
  record(LOSE);
  if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
}
function rescue() {                        // 실수 되돌리기: 밟기 직전으로 (최고 기록에서는 제외)
  if (!G.over || G.won || !G.prev) return;
  if (!G.practice) stats.popLast(LOSE);      // 실패로 끝난 게 아니니 그 기록은 지운다
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

  renderDailyButton();
  const st = $('status'), best = stats.best(G.level);
  st.classList.toggle('win-text', G.won);
  st.classList.toggle('lose-text', G.over && !G.won);
  st.classList.toggle('daily-text', !!G.daily && !G.over);
  st.classList.toggle('challenge', !!G.challenge && !G.over);
  $('btn-share').disabled = !started();
  if (G.won) st.textContent = `성공!  기록 ${fmt(elapsed())}`;
  else if (G.over) st.textContent = '지뢰를 밟았어요';
  else if (G.challenge) st.textContent = `⚑ 친구 기록 ${fmt(G.challenge.time)}에 도전 중!${G.practice ? ' (연습)' : ''}`;
  else if (G.daily) st.textContent = `📅 ${dayLabel(G.daily)} 오늘의 게임 · ${G.level}${G.practice ? ' (연습 · 기록 안 남음)' : ''}`;
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
    const what = G.daily ? `${dayLabel(G.daily)} 오늘의 게임 · ${G.level}` : `${G.level} · ${G.C}×${G.R} · 지뢰 ${G.M}개`;
    $('over-meta').textContent = G.won ? `${what} · ${fmt(elapsed())}` : what;
    const b = $('over-best');
    const dailyWin = G.won && G.daily && !G.practice;
    b.classList.toggle('new', G.won && (G.newBest || dailyWin));
    if (!G.won) b.textContent = '찍을 필요 없는 판이었어요. 다시 한번 따져 볼까요?';
    else if (G.practice) b.textContent = '연습이라 기록은 남지 않아요';
    else if (dailyWin) b.textContent = `🔥 오늘의 게임 ${stats.dailyStreaks(kstToday())[0]}일 연속 완료!`;
    else if (G.newBest) b.textContent = '★  최고 기록 달성!';
    else if (G.rescued) b.textContent = '되돌린 판이라 최고 기록에서 빠져요';
    else b.textContent = G.prevBest === null ? '' : `최고 기록 ${fmt(G.prevBest)}`;
    const ch = $('over-challenge');
    ch.hidden = !G.challenge;
    if (G.challenge) {
      const mine = Math.floor(elapsed()), theirs = G.challenge.time;
      ch.classList.toggle('lose', !G.won || mine > theirs);
      ch.textContent = !G.won ? `친구 기록 ${fmt(theirs)}에 도전 중이었어요`
        : mine < theirs ? `⚑ 친구 기록 ${fmt(theirs)}보다 ${fmt(theirs - mine)} 빨랐어요!`
          : mine === theirs ? `⚑ 친구 기록 ${fmt(theirs)}와 동점!`
            : `친구 기록 ${fmt(theirs)}보다 ${fmt(mine - theirs)} 늦었어요`;
    }
    $('btn-share-win').hidden = !G.won;
    $('btn-rescue').hidden = G.won || !G.prev;
    $('btn-again').textContent = G.won ? '다음 판 →' : '새 게임';
  }
  renderBoard();
}

function renderDailyButton() {
  const today = kstToday(), done = stats.dailyWin(today), btn = $('btn-daily');
  const now = G.daily === today && !G.practice && playing();
  btn.classList.toggle('on', now);
  btn.classList.toggle('done', !!done && !now);
  $('daily-label').textContent = done ? `오늘 ✓ ${fmt(done.time)}` : '오늘의 게임';
}

/* ───────── 오늘의 게임 ───────── */
const hasProgress = () => playing() && G.acted;
function requestDaily(challenge = null) {
  const date = kstToday();
  if (G.daily === date && playing()) {
    if (challenge) { G.challenge = challenge; saveGame(); render(); toast(`친구 기록 ${fmt(challenge.time)}에 도전!`); }
    else toast('지금 오늘의 게임을 하고 있어요');
    return;
  }
  const done = stats.dailyWin(date), quit = hasProgress();
  const go = (practice) => {
    if (quit) record(QUIT);
    G.level = dailyLevel(date);              // 일반 게임 설정(prefs)은 그대로 둠
    newGame({ daily: date, practice, challenge });
    if (challenge) toast(`친구 기록 ${fmt(challenge.time)}에 도전!`);
  };
  const quitMsg = quit ? ' 지금 하던 판은 \'포기\'로 기록돼요.' : '';
  if (done) openConfirm('오늘의 게임 다시 하기', `오늘은 이미 ${fmt(done.time)}에 완료했어요. 다시 하면 기록은 남지 않아요.${quitMsg}`, '다시 하기', () => go(true));
  else if (quit) openConfirm('오늘의 게임을 시작할까요?', quitMsg.trim(), '시작', () => go(false));
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
  $('stat-daily').innerHTML = `<div class="daily-head"><b>📅 오늘의 게임</b>
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
    if (!games.length) html = '<p class="empty">아직 기록이 없어요.<br>한 판 해 보세요!</p>';
    else {
      html = '<table class="stable">';
      games.forEach((g, i) => {
        const cls = { [WIN]: 'r-win', [LOSE]: 'r-lose', [QUIT]: 'r-quit' }[g.result] || '';
        html += `<tr class="${i % 2 === 0 ? 'alt' : ''}"><td class="date">${esc(String(g.date || '').slice(5))}</td>
          <td>${g.daily ? '📅 ' : ''}${esc(g.level)}</td>
          <td>${fmt(g.time || 0)}${g.rescued ? ' <span class="none">↺</span>' : ''}</td>
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

/* 예전에 저장된 판이라 시작 칸을 모르면: 열린 0 칸 아무거나 (같은 영역이 열린다) */
function shareStart() {
  if (G.start !== null && G.num[G.start] === 0) return G.start;
  for (let i = 0; i < n(); i++) if (G.state[i] === OPEN && G.num[i] === 0) return i;
  return null;
}

/* 공유 링크는 쿼리 문자열(?b=…&t=…&d=…)로 만든다. ('#' 뒤는 일부 앱에서 잘릴 수 있어서) */
function shareUrl(withTime) {
  let q = `?b=${encodeBoard(G.R, G.C, shareStart(), G.mines)}`;
  if (withTime) q += `&t=${Math.floor(elapsed())}`;
  if (G.daily) q += `&d=${G.daily}`;
  return location.origin + location.pathname + q;
}

/* ───────── 공유 이미지 (캔버스로 그리기) ───────── */
const IMG = { text: '#1B1E2E', sub: '#6E7491', card: '#FFFFFF', chip: '#E2E6F1', tile: '#DCE1EE', open: '#F4F5FA',
  flag: '#F43F5E', win: '#10B981', accent: '#5B5BF0',
  n: [null, '#3B6CF6', '#16A34A', '#E11D48', '#7C3AED', '#B45309', '#0891B2', '#1B1E2E', '#6E7491'] };
const IMG_FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", "Malgun Gothic", sans-serif';

function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}

/* brag: 다 푼 판(지뢰엔 깃발) · 아니면 시작 칸만 열린 처음 모습 */
function renderShareImage(brag) {
  const W = 800, c = document.createElement('canvas');
  c.width = W; c.height = W;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, W, W);
  grad.addColorStop(0, '#EEF1F8'); grad.addColorStop(1, '#E3E5FB');
  x.fillStyle = grad; x.fillRect(0, 0, W, W);

  // 머리글
  x.fillStyle = IMG.text; x.textBaseline = 'middle';
  x.font = `800 44px ${IMG_FONT}`;
  x.fillText('Minesweeper', 60, 76);
  const tag = G.daily ? `오늘의 게임 · ${dayLabel(G.daily)}` : `${G.level} · 지뢰 ${G.M}개`;
  x.font = `700 26px ${IMG_FONT}`;
  const tw = x.measureText(tag).width + 40;
  x.fillStyle = IMG.chip; roundRect(x, W - 60 - tw, 52, tw, 48, 24); x.fill();
  x.fillStyle = IMG.text; x.textAlign = 'center'; x.fillText(tag, W - 60 - tw / 2, 77); x.textAlign = 'left';

  // 처음 모습: 시작 칸에서 연쇄로 열리는 칸
  const N = n(), nb = neighbors(G.R, G.C), shown = new Uint8Array(N);
  if (brag) for (let i = 0; i < N; i++) shown[i] = G.mines[i] ? 0 : 1;
  else {
    const s0 = shareStart(), stack = s0 === null ? [] : [s0];
    if (s0 !== null) shown[s0] = 1;
    while (stack.length) {
      const i = stack.pop();
      if (G.num[i] !== 0) continue;
      for (const j of nb[i]) if (!shown[j]) { shown[j] = 1; stack.push(j); }
    }
  }

  // 판 (세로로 긴 판은 이미지에선 눕혀서)
  const flip = G.R > G.C, rows = flip ? G.C : G.R, cols = flip ? G.R : G.C;
  const pad = 22, cs = Math.min((680 - pad * 2) / cols, (540 - pad * 2) / rows);
  const bw = cols * cs + pad * 2, bh = rows * cs + pad * 2, bx = (W - bw) / 2, by = 130 + (540 - bh) / 2;
  x.save(); x.shadowColor = 'rgba(42,51,88,.14)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
  x.fillStyle = IMG.card; roundRect(x, bx, by, bw, bh, 28); x.fill(); x.restore();
  const gap = Math.max(1, cs * 0.06), rr = cs * 0.16;
  x.textAlign = 'center';
  x.font = `800 ${Math.round(cs * 0.56)}px "Segoe UI", ${IMG_FONT}`;
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / G.C), cc = i % G.C;
    const px = bx + pad + (flip ? r : cc) * cs, py = by + pad + (flip ? cc : r) * cs;
    x.fillStyle = shown[i] ? IMG.open : IMG.tile;
    roundRect(x, px + gap, py + gap, cs - gap * 2, cs - gap * 2, rr); x.fill();
    if (shown[i] && G.num[i] > 0) {
      x.fillStyle = IMG.n[G.num[i]];
      x.fillText(String(G.num[i]), px + cs / 2, py + cs * 0.54);
    } else if (brag && G.mines[i]) {                  // 깃발
      x.strokeStyle = IMG.text; x.lineWidth = Math.max(1.5, cs * 0.07); x.lineCap = 'round';
      x.beginPath(); x.moveTo(px + cs * 0.36, py + cs * 0.22); x.lineTo(px + cs * 0.36, py + cs * 0.78); x.stroke();
      x.fillStyle = IMG.flag;
      x.beginPath(); x.moveTo(px + cs * 0.36, py + cs * 0.22); x.lineTo(px + cs * 0.72, py + cs * 0.22);
      x.lineTo(px + cs * 0.62, py + cs * 0.37); x.lineTo(px + cs * 0.72, py + cs * 0.52); x.lineTo(px + cs * 0.36, py + cs * 0.52);
      x.closePath(); x.fill();
    }
  }

  // 아래 문구
  if (brag) {
    x.fillStyle = IMG.win; x.font = `800 44px ${IMG_FONT}`;
    x.fillText(`✓ ${fmt(elapsed())} 만에 성공!`, W / 2, 735);
  } else {
    x.fillStyle = IMG.accent; x.font = `800 40px ${IMG_FONT}`;
    x.fillText('이 판 같이 풀어볼래요?', W / 2, 735);
  }
  return c;
}

/* ───────── 카카오톡 공유 (JavaScript 키 · 등록된 도메인에서만 동작) ───────── */
const KAKAO_KEY = '7d4bc1ef953608ec41d536ba29ff43a4';
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js';
const KAKAO_SRI = 'sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E';
const OG_IMAGE = 'https://hy1116.github.io/minesweeper/og-image.png';
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
  if (!started() || shareStart() === null) return;
  brag = !!brag && G.won;
  const t = fmt(elapsed());
  const what = G.daily ? `오늘의 게임(${dayLabel(G.daily)})` : G.level;
  const extra = brag && G.rescued ? ' (되돌리기 사용)' : '';
  const streak = brag && G.daily && !G.practice ? ` 🔥 ${stats.dailyStreaks(kstToday())[0]}일 연속!` : '';
  SH = {
    brag, url: shareUrl(brag),
    title: brag ? `지뢰찾기 ${what} — ${t} 성공!` : `지뢰찾기 ${what}`,
    text: brag ? `지뢰찾기 ${what}을 ${t}에 깼어요${extra}!${streak} 나보다 빨리 깰 수 있어요? 💣`
      : `지뢰찾기 ${what} 같은 판으로 같이 해요 💣`,
    canvas: renderShareImage(brag), blob: null, kakaoImage: null,
  };
  $('share-title').textContent = brag ? '자랑하기' : '이 판 공유하기';
  $('share-msg').textContent = brag ? `${t} 기록이 담긴 도전 링크를 보내요. 친구가 열면 내 기록과 비교돼요.`
    : '친구가 링크를 열면 똑같은 판이 같은 시작 칸에서 열려요.';
  $('share-preview').src = SH.canvas.toDataURL('image/png');
  $('share-more').hidden = !navigator.share;
  openModal('share');

  // 카카오톡을 누르는 순간 바로 열리도록 미리 준비 (SDK + 이미지 업로드)
  const cur = SH;
  new Promise((res) => cur.canvas.toBlob(res, 'image/png')).then((blob) => {
    cur.blob = blob;
    return loadKakao().then((K) => K.Share.uploadImage({ file: [new File([blob], 'minesweeper.png', { type: 'image/png' })] }));
  }).then((r) => { cur.kakaoImage = r.infos.original; }).catch(() => { /* 실패하면 기본 이미지 사용 */ });
}

function kakaoPayload(sh) {
  const link = { mobileWebUrl: sh.url, webUrl: sh.url };
  const button = sh.brag ? '도전하기' : '같이 하기';
  const img = sh.kakaoImage || { url: OG_IMAGE, width: 1200, height: 630 };
  return {
    objectType: 'feed',
    content: {
      title: sh.title,
      description: sh.brag ? '나보다 빨리 깰 수 있어요? 같은 판으로 도전해 보세요!' : '찍을 필요 없는 지뢰찾기. 같은 판으로 같이 해요!',
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
  const sh = SH, data = { title: 'Minesweeper', text: sh.text, url: sh.url };
  if (sh.brag && sh.blob) {                     // 자랑하기: 이미지도 함께 (지원하는 기기만)
    const file = new File([sh.blob], 'minesweeper.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
  }
  try { await navigator.share(data); closeModal('share'); } catch (e) {
    if (e && e.name !== 'AbortError') toast('공유하지 못했어요');
  }
}

function shareSave() {
  const a = document.createElement('a');
  a.href = SH.canvas.toDataURL('image/png');
  a.download = SH.brag ? `minesweeper-${G.C}x${G.R}-${fmt(elapsed()).replace(/:/g, '')}.png` : 'minesweeper-board.png';
  document.body.appendChild(a); a.click(); a.remove();
  toast('이미지를 저장했어요');
}

/* 공유 링크로 들어왔을 때: ?b=<판 코드>&t=<친구 기록(초)>&d=<오늘의 게임 날짜> */
function handleShareLink() {
  const q = new URLSearchParams(location.search);
  if (!q.has('b') && !q.has('d')) return false;
  history.replaceState(null, '', location.pathname);   // 새로고침 때 다시 열리지 않게
  const t = Number(q.get('t'));
  const challenge = q.has('t') && Number.isInteger(t) && t >= 0 && t < 360000 ? { time: t } : null;
  const d = q.get('d');
  // 오늘 날짜의 '오늘의 게임' 링크면 → 진짜 오늘의 게임으로 (기록도 오늘의 게임으로 남음)
  if (d === kstToday()) { requestDaily(challenge); return true; }
  const b = decodeBoard(q.get('b'));
  if (!b) { toast('잘못된 공유 링크예요'); return false; }
  const go = () => {
    G.level = b.level; G.daily = null;
    savePrefs();
    newGame({ board: b, challenge });
    toast(challenge ? `친구 기록 ${fmt(challenge.time)}에 도전!` : '공유받은 판을 열었어요');
  };
  if (hasProgress()) {
    openConfirm('공유받은 판을 열까요?', '지금 하던 판은 \'포기\'로 기록돼요.', '열기', () => { record(QUIT); go(); });
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
/* 진행 중이면 확인 후 새 게임 */
function requestNewGame(before = null, title = '새 게임을 시작할까요?') {
  const go = () => {
    if (before) before();
    else if (G.daily) G.level = LEVEL_NAMES.includes(prefs.level) ? prefs.level : '초급';   // 오늘의 게임 뒤엔 원래 난이도로
    G.daily = null;
    savePrefs(); newGame();
  };
  if (!hasProgress()) { go(); return; }
  openConfirm(title, '지금 하던 판은 \'포기\'로 기록돼요.', '새 게임', () => { record(QUIT); go(); });
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
    if (name === G.level && !G.daily && playing()) return;
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
  if (modalOpen() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.code === 'KeyN') requestNewGame();
  else if (ev.code === 'KeyD') toggleTheme();
  else if (ev.code === 'KeyS') openStats();
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
