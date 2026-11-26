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

if (typeof module !== 'undefined') {
  module.exports = { LEVELS, neighbors, countNumbers, solvable, generateBoard };
}
