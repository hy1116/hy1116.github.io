/* 지뢰찾기 핵심 로직: 판 만들기 · 찍기 없이 풀리는지 검사하는 풀이기
 * 브라우저 메인 스레드, Web Worker, Node 테스트에서 모두 사용한다. */
'use strict';

const LEVELS = {
  '초급': { R: 9, C: 9, M: 10 },
  '중급': { R: 16, C: 16, M: 40 },
  '고급': { R: 30, C: 16, M: 99 },      // 휴대폰 세로 화면에 맞게 세로로 긴 판 (가로 화면이면 돌려서 30열)
};

const nbCache = new Map();
function neighbors(R, C) {
  const key = R + 'x' + C;
  if (nbCache.has(key)) return nbCache.get(key);
  const nb = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const list = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < R && cc >= 0 && cc < C) list.push(rr * C + cc);
        }
      nb.push(list);
    }
  nbCache.set(key, nb);
  return nb;
}

function countNumbers(R, C, mines) {
  const nb = neighbors(R, C), num = new Int8Array(R * C);
  for (let i = 0; i < R * C; i++) {
    if (mines[i]) { num[i] = -1; continue; }
    let k = 0;
    for (const j of nb[i]) k += mines[j];
    num[i] = k;
  }
  return num;
}

/* 사람이 논리만으로(찍기 없이) 끝까지 풀 수 있는지 흉내 내 본다.
 * 쓰는 추론: ① 한 숫자 칸만 보고 확정  ② 두 숫자 칸이 겹치는 부분 비교  ③ 남은 지뢰 수 */
function solvable(R, C, mines, start) {
  const n = R * C, nb = neighbors(R, C), num = countNumbers(R, C, mines);
  let M = 0;
  for (let i = 0; i < n; i++) M += mines[i];
  const open = new Uint8Array(n), flag = new Uint8Array(n);
  let opened = 0, flagged = 0;
  let bad = false;

  const reveal = (i0) => {
    if (open[i0] || flag[i0]) return;
    if (mines[i0]) { bad = true; return; }          // 추론이 틀렸다면 (일어나면 안 됨)
    const stack = [i0];
    open[i0] = 1; opened++;
    while (stack.length) {
      const i = stack.pop();
      if (num[i] !== 0) continue;
      for (const j of nb[i]) if (!open[j] && !flag[j]) { open[j] = 1; opened++; stack.push(j); }
    }
  };
  const mark = (i) => { if (!flag[i] && !open[i]) { flag[i] = 1; flagged++; } };

  reveal(start);
  for (;;) {
    if (bad) return false;
    if (opened === n - M) return true;
    let progress = false;

    // ① 숫자 칸 하나씩
    const front = [];
    for (let i = 0; i < n; i++) {
      if (!open[i] || num[i] <= 0) continue;
      const unk = [];
      let f = 0;
      for (const j of nb[i]) { if (flag[j]) f++; else if (!open[j]) unk.push(j); }
      if (!unk.length) continue;
      const need = num[i] - f;
      if (need === 0) { unk.forEach(reveal); progress = true; }
      else if (need === unk.length) { unk.forEach(mark); progress = true; }
      else front.push({ unk, need });
    }
    if (progress) continue;

    // ② 겹치는 두 숫자 칸: 겹친 부분 지뢰 수의 범위로 나머지 부분을 확정
    const byCell = new Map();
    front.forEach((f, k) => f.unk.forEach((c) => {
      if (!byCell.has(c)) byCell.set(c, []);
      byCell.get(c).push(k);
    }));
    const seen = new Set();
    for (let a = 0; a < front.length && !progress; a++) {
      for (const c of front[a].unk) for (const b of byCell.get(c)) {
        if (b === a) continue;
        const key = a < b ? a * 100000 + b : b * 100000 + a;
        if (seen.has(key)) continue;
        seen.add(key);
        const A = front[a], B = front[b], setB = new Set(B.unk);
        const onlyA = A.unk.filter((x) => !setB.has(x)), inter = A.unk.length - onlyA.length;
        const setA = new Set(A.unk), onlyB = B.unk.filter((x) => !setA.has(x));
        const xmin = Math.max(0, A.need - onlyA.length, B.need - onlyB.length);
        const xmax = Math.min(inter, A.need, B.need);
        for (const [S, need, only] of [[A, A.need, onlyA], [B, B.need, onlyB]]) {
          if (!only.length) continue;
          if (need - xmin === 0) { only.forEach(reveal); progress = true; }
          else if (need - xmax === only.length) { only.forEach(mark); progress = true; }
          void S;
        }
      }
    }
    if (progress) continue;

    // ③ 남은 지뢰 수
    const left = M - flagged, unknown = n - opened - flagged;
    if (left === 0) { for (let i = 0; i < n; i++) if (!open[i] && !flag[i]) reveal(i); continue; }
    if (left === unknown) { for (let i = 0; i < n; i++) if (!open[i] && !flag[i]) mark(i); continue; }
    return false;                                      // 막힘 → 찍어야 하는 판
  }
}

/* 첫 칸(start) 주변 3×3 은 비워서 넓게 열리게 하고, 찍기 없이 풀리는 판이 나올 때까지 다시 만든다 */
function generateBoard(R, C, M, start, rand = Math.random, maxTries = 20000) {
  const n = R * C, nb = neighbors(R, C);
  const banned = new Uint8Array(n);
  banned[start] = 1;
  for (const j of nb[start]) banned[j] = 1;
  const pool = [];
  for (let i = 0; i < n; i++) if (!banned[i]) pool.push(i);
  let mines = null, tries = 0;
  for (; tries < maxTries; tries++) {
    mines = new Uint8Array(n);
    for (let k = 0; k < M; k++) {                    // 부분 셔플로 M개 고르기
      const j = k + Math.floor(rand() * (pool.length - k));
      [pool[k], pool[j]] = [pool[j], pool[k]];
      mines[pool[k]] = 1;
    }
    if (solvable(R, C, mines, start)) return { mines: Array.from(mines), tries: tries + 1, noGuess: true };
  }
  return { mines: Array.from(mines), tries, noGuess: false };   // 아주 드물게 실패하면 그냥 판
}

/* ───────── 시드 난수 (오늘의 게임: 같은 날짜 → 모든 기기에서 같은 판) ─────────
 * 주의: generateBoard / dailyBoard 의 난수 사용 순서를 바꾸면 같은 날짜의 판이 달라진다. */
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

/* 오늘의 게임 판: 시작 칸도 시드로 정한다 (가장자리에서 2칸 이상 안쪽) */
function dailyBoard(R, C, M, seed) {
  const rand = seedRandom(seed);
  const r = 2 + Math.floor(rand() * (R - 4)), c = 2 + Math.floor(rand() * (C - 4));
  const start = r * C + c;
  return { start, ...generateBoard(R, C, M, start, rand) };
}

/* ───────── 공유 링크용 판 코드 ─────────
 * 예) "9x9.40.<지뢰 비트>" = 행×열, 시작 칸, 지뢰 위치를 6칸씩 묶어 base64url 한 글자로.
 * 고급(99개)도 80글자쯤이라 링크가 짧다. 받는 쪽에서 난이도와 맞는지 다시 확인한다. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBoard(R, C, start, mines) {
  let s = '';
  for (let i = 0; i < R * C; i += 6) {
    let v = 0;
    for (let k = 0; k < 6; k++) v = (v << 1) | (mines[i + k] ? 1 : 0);
    s += B64[v];
  }
  return `${R}x${C}.${start}.${s}`;
}

function decodeBoard(code) {
  const m = /^(\d{1,2})x(\d{1,2})\.(\d{1,4})\.([A-Za-z0-9_-]{1,200})$/.exec(String(code || ''));
  if (!m) return null;
  const R = Number(m[1]), C = Number(m[2]), start = Number(m[3]), n = R * C;
  if (m[4].length !== Math.ceil(n / 6) || start >= n) return null;
  const mines = new Array(n).fill(0);
  let M = 0;
  for (let j = 0; j < m[4].length; j++) {
    const v = B64.indexOf(m[4][j]);
    for (let k = 0; k < 6; k++) {
      const i = j * 6 + k, bit = (v >> (5 - k)) & 1;
      if (i < n) { mines[i] = bit; M += bit; } else if (bit) return null;
    }
  }
  const level = Object.keys(LEVELS).find((name) => {
    const L = LEVELS[name];
    return L.M === M && ((L.R === R && L.C === C) || (L.R === C && L.C === R));
  });
  if (!level || mines[start] || countNumbers(R, C, mines)[start] !== 0) return null;   // 시작 칸은 0 이어야 함
  return { level, R, C, M, start, mines };
}

if (typeof module !== 'undefined') {
  module.exports = { LEVELS, neighbors, countNumbers, solvable, generateBoard, seedRandom, dailyBoard, encodeBoard, decodeBoard };
}
