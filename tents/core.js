/* 텐트 핵심 로직: 퍼즐 만들기 · 논리만으로 풀리는지 검사하는 풀이기 · 공유 코드
 * 브라우저 메인 스레드, Web Worker, Node 테스트에서 모두 사용한다.
 *
 * 규칙
 *  - 나무마다 바로 옆(상하좌우)에 텐트가 하나씩 짝지어진다. (나무 수 = 텐트 수, 1:1)
 *  - 텐트끼리는 대각선을 포함해 서로 붙을 수 없다.
 *  - 행·열 끝의 숫자는 그 줄의 텐트 개수다. */
'use strict';

const LEVELS = {
  '쉬움': { R: 6, C: 6, T: 7, deep: 0 },      // 기본 규칙만으로 풀림
  '보통': { R: 8, C: 8, T: 12, deep: 1 },     // 가끔 '이렇게 두면 모순' 추론이 필요
  '어려움': { R: 10, C: 10, T: 19, deep: 2 }, // 그런 추론이 여러 번 필요
};

const U = 0, TENT = 1, GRASS = 2;             // 칸 상태 (나무 칸은 따로 표시)

const nbCache = new Map();
/* [orth, all8] 이웃 목록 */
function neighbors(R, C) {
  const key = R + 'x' + C;
  if (nbCache.has(key)) return nbCache.get(key);
  const orth = [], all = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const o = [], a = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= R || cc < 0 || cc >= C) continue;
          a.push(rr * C + cc);
          if (!dr || !dc) o.push(rr * C + cc);
        }
      orth.push(o); all.push(a);
    }
  const v = { orth, all };
  nbCache.set(key, v);
  return v;
}

/* 이분 매칭 크기: left 각각이 adj(l) 중 서로 다른 칸 하나씩 가질 수 있는 최대 개수 */
function matchSize(left, adj) {
  const owner = new Map();
  let size = 0;
  const tryL = (l, seen) => {
    for (const x of adj(l)) {
      if (seen.has(x)) continue;
      seen.add(x);
      const o = owner.get(x);
      if (o === undefined || tryL(o, seen)) { owner.set(x, l); return true; }
    }
    return false;
  };
  for (const l of left) if (tryL(l, new Set())) size++;
  return size;
}

/* 퍼즐 P = { R, C, tree: Uint8Array, rows: [], cols: [] }
 * st: 칸 상태 배열 (나무 칸은 GRASS 로 둔다). 규칙으로 확정되는 칸을 채우고, 모순이면 false. */
function propagate(P, st) {
  const { R, C, tree, rows, cols } = P, n = R * C, { orth, all } = neighbors(R, C);
  for (;;) {
    let changed = false;
    const set = (i, v) => { if (st[i] === U) { st[i] = v; changed = true; } };

    // 텐트 주변 8칸은 잔디, 텐트끼리 붙으면 모순
    for (let i = 0; i < n; i++) {
      if (st[i] !== TENT) continue;
      for (const j of all[i]) { if (st[j] === TENT) return false; set(j, GRASS); }
    }
    // 행 / 열 개수
    for (let line = 0; line < R + C; line++) {
      const isRow = line < R, k = isRow ? line : line - R, need = isRow ? rows[k] : cols[k];
      const len = isRow ? C : R, at = (p) => (isRow ? k * C + p : p * C + k);
      let t = 0, u = 0;
      for (let p = 0; p < len; p++) { const s = st[at(p)]; if (s === TENT) t++; else if (s === U) u++; }
      if (t > need || t + u < need) return false;
      if (u && (t === need || t + u === need)) {
        const v = t === need ? GRASS : TENT;
        for (let p = 0; p < len; p++) set(at(p), v);
      }
    }
    if (changed) continue;

    // 나무: 후보(옆의 빈 칸·텐트)가 없으면 모순, 빈 칸 하나뿐이고 텐트가 없으면 거기가 텐트
    // '내 텐트'(나 말고 다른 나무와 안 붙은 텐트)가 있는 나무는 만족 → 만족한 나무하고만 붙은 빈 칸은 잔디
    const satisfied = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!tree[i]) continue;
      let cand = 0, last = -1, tents = 0;
      for (const j of orth[i]) {
        if (st[j] === U) { cand++; last = j; }
        else if (st[j] === TENT) {
          tents++;
          if (orth[j].filter((k) => tree[k]).length === 1) satisfied[i] = 1;
        }
      }
      if (!cand && !tents) return false;
      if (cand === 1 && !tents) set(last, TENT);
    }
    for (let i = 0; i < n; i++) {
      if (st[i] !== U) continue;
      const ts = orth[i].filter((k) => tree[k]);
      if (!ts.length || ts.every((k) => satisfied[k])) set(i, GRASS);
    }
    if (changed) continue;

    // 짝 맞추기: 모든 나무가 서로 다른 칸(빈 칸·텐트)을, 모든 텐트가 서로 다른 나무를 가질 수 있어야 함
    const trees = [], tents = [];
    for (let i = 0; i < n; i++) { if (tree[i]) trees.push(i); else if (st[i] === TENT) tents.push(i); }
    if (matchSize(trees, (i) => orth[i].filter((j) => st[j] !== GRASS)) < trees.length) return false;
    if (matchSize(tents, (i) => orth[i].filter((j) => tree[j])) < tents.length) return false;
    return true;
  }
}

/* 논리로 풀기. deep > 0 이면 '여기에 텐트(잔디)를 두면 모순' 한 단계 추론도 쓴다.
 * 결과: { st, solved, deepUsed } — 추론이 모두 확실한 것이라 끝까지 풀리면 정답은 하나뿐이다. */
function solve(P, deep = 2) {
  const n = P.R * P.C, st = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (P.tree[i]) st[i] = GRASS;
  let deepUsed = 0;
  if (!propagate(P, st)) return { st, solved: false, deepUsed };
  while (st.includes(U)) {
    if (!deep) return { st, solved: false, deepUsed };
    let progress = false;
    for (let i = 0; i < n && !progress; i++) {
      if (st[i] !== U) continue;
      for (const [guess, other] of [[TENT, GRASS], [GRASS, TENT]]) {
        const t = st.slice();
        t[i] = guess;
        if (!propagate(P, t)) {
          st[i] = other;
          if (!propagate(P, st)) return { st, solved: false, deepUsed };
          deepUsed++; progress = true;
          break;
        }
      }
    }
    if (!progress) return { st, solved: false, deepUsed };
  }
  return { st, solved: isSolved(P, st), deepUsed };
}

/* 완성 판정: 행·열 개수, 텐트끼리 안 붙음, 나무-텐트 1:1 짝 */
function isSolved(P, st) {
  const { R, C, tree, rows, cols } = P, n = R * C, { orth, all } = neighbors(R, C);
  const rc = new Array(R).fill(0), cc = new Array(C).fill(0), tents = [], trees = [];
  for (let i = 0; i < n; i++) {
    if (tree[i]) { trees.push(i); continue; }
    if (st[i] !== TENT) continue;
    tents.push(i); rc[Math.floor(i / C)]++; cc[i % C]++;
    if (all[i].some((j) => st[j] === TENT && !tree[j])) return false;
  }
  if (tents.length !== trees.length) return false;
  if (rc.some((v, k) => v !== rows[k]) || cc.some((v, k) => v !== cols[k])) return false;
  return matchSize(trees, (i) => orth[i].filter((j) => !tree[j] && st[j] === TENT)) === trees.length;
}

/* 퍼즐 만들기: 텐트를 서로 안 붙게 흩뿌리고, 텐트마다 옆에 나무를 하나 심은 뒤
 * 난이도에 맞는 추론만으로 끝까지 풀리는 퍼즐이 나올 때까지 다시 만든다. */
function generatePuzzle(R, C, T, deep, rand = Math.random, maxTries = 4000) {
  const n = R * C, { orth, all } = neighbors(R, C);
  let best = null;
  for (let tries = 1; tries <= maxTries; tries++) {
    const tent = new Uint8Array(n), tree = new Uint8Array(n), order = [];
    for (let i = 0; i < n; i++) order.push(i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let placed = 0;
    for (const i of order) {
      if (placed === T) break;
      if (tent[i] || tree[i] || all[i].some((j) => tent[j])) continue;
      const spots = orth[i].filter((j) => !tent[j] && !tree[j]);
      if (!spots.length) continue;
      tent[i] = 1;
      tree[spots[Math.floor(rand() * spots.length)]] = 1;
      placed++;
    }
    if (placed < T) continue;
    const rows = new Array(R).fill(0), cols = new Array(C).fill(0);
    for (let i = 0; i < n; i++) if (tent[i]) { rows[Math.floor(i / C)]++; cols[i % C]++; }
    const P = { R, C, tree, rows, cols };
    const res = solve(P, deep);
    if (!res.solved) continue;
    const wantDeep = deep >= 2 ? 2 : 0;
    const out = { R, C, tree: Array.from(tree), rows, cols, solution: Array.from(res.st), tries, deepUsed: res.deepUsed };
    if (res.deepUsed >= wantDeep) return out;
    if (!best || res.deepUsed > best.deepUsed) best = out;    // 어려운 조건을 못 채우면 가장 어려운 것
  }
  return best;
}

/* ───────── 시드 난수 (오늘의 퍼즐: 같은 날짜 → 모든 기기에서 같은 퍼즐) ─────────
 * 주의: generatePuzzle 의 난수 사용 순서를 바꾸면 같은 날짜의 퍼즐이 달라진다. */
function seedRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {                                  // mulberry32
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function levelPuzzle(level, seed = null) {
  const L = LEVELS[level];
  return generatePuzzle(L.R, L.C, L.T, L.deep, seed ? seedRandom(seed) : Math.random);
}

/* ───────── 공유 링크용 퍼즐 코드 ─────────
 * 예) "8x8.<나무 비트>.<행 개수><열 개수>" — 나무 위치를 6칸씩 묶어 base64url 한 글자로, 개수는 한 글자씩.
 * 받는 쪽에서 풀이기로 다시 풀어서 정답이 하나뿐인지 확인한다. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodePuzzle(P) {
  let s = '';
  for (let i = 0; i < P.R * P.C; i += 6) {
    let v = 0;
    for (let k = 0; k < 6; k++) v = (v << 1) | (P.tree[i + k] ? 1 : 0);
    s += B64[v];
  }
  return `${P.R}x${P.C}.${s}.${[...P.rows, ...P.cols].map((v) => B64[v]).join('')}`;
}

function decodePuzzle(code) {
  const m = /^(\d{1,2})x(\d{1,2})\.([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{2,40})$/.exec(String(code || ''));
  if (!m) return null;
  const R = Number(m[1]), C = Number(m[2]), n = R * C;
  const level = Object.keys(LEVELS).find((k) => LEVELS[k].R === R && LEVELS[k].C === C);
  if (!level || m[3].length !== Math.ceil(n / 6) || m[4].length !== R + C) return null;
  const tree = new Uint8Array(n);
  for (let j = 0; j < m[3].length; j++) {
    const v = B64.indexOf(m[3][j]);
    for (let k = 0; k < 6; k++) {
      const i = j * 6 + k, bit = (v >> (5 - k)) & 1;
      if (i < n) tree[i] = bit; else if (bit) return null;
    }
  }
  const nums = [...m[4]].map((ch) => B64.indexOf(ch));
  const rows = nums.slice(0, R), cols = nums.slice(R);
  if (rows.some((v) => v > C) || cols.some((v) => v > R)) return null;
  const P = { R, C, tree, rows, cols };
  const res = solve(P, 2);
  if (!res.solved) return null;                   // 풀리지 않거나 답이 여러 개인 퍼즐
  return { level, R, C, tree: Array.from(tree), rows, cols, solution: Array.from(res.st) };
}

if (typeof module !== 'undefined') {
  module.exports = { LEVELS, U, TENT, GRASS, neighbors, propagate, solve, isSolved, generatePuzzle,
    seedRandom, levelPuzzle, encodePuzzle, decodePuzzle };
}
