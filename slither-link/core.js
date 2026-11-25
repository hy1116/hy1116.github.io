/* 슬리더 링크 핵심 로직: 격자 · 풀이기 · 퍼즐 생성기
 * (slither_link.py 의 Grid / Solver / generate_puzzle 를 그대로 옮긴 것)
 * 브라우저 메인 스레드, Web Worker, Node 테스트에서 모두 사용한다. */
'use strict';

const DIFFICULTY = { '쉬움': 0.62, '보통': 0.45, '어려움': 0.0 };

class Grid {
  constructor(R, C) {
    this.R = R; this.C = C;
    this.nh = (R + 1) * C;
    this.nv = R * (C + 1);
    this.ne = this.nh + this.nv;
    this.nvert = (R + 1) * (C + 1);

    this.edgeVerts = new Array(this.ne);
    for (let r = 0; r <= R; r++)
      for (let c = 0; c < C; c++)
        this.edgeVerts[this.h(r, c)] = [this.vid(r, c), this.vid(r, c + 1)];
    for (let r = 0; r < R; r++)
      for (let c = 0; c <= C; c++)
        this.edgeVerts[this.v(r, c)] = [this.vid(r, c), this.vid(r + 1, c)];

    this.cellEdges = [];
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++)
        this.cellEdges.push([this.h(r, c), this.h(r + 1, c), this.v(r, c), this.v(r, c + 1)]);

    this.edgeCells = Array.from({ length: this.ne }, () => []);
    this.cellEdges.forEach((es, cell) => es.forEach(e => this.edgeCells[e].push(cell)));

    this.vertEdges = Array.from({ length: this.nvert }, () => []);
    this.edgeVerts.forEach(([a, b], e) => { this.vertEdges[a].push(e); this.vertEdges[b].push(e); });
  }
  h(r, c) { return r * this.C + c; }
  v(r, c) { return this.nh + r * (this.C + 1) + c; }
  vid(r, c) { return r * (this.C + 1) + c; }
}

/* 해의 개수를 세는 풀이기 (유일해 검증용). 상태: -1 미정, 0 없음, 1 선 */
class Solver {
  constructor(grid, clues, nodeLimit = 30000) {
    this.g = grid; this.clues = clues;
    this.nodeLimit = nodeLimit; this.nodes = 0; this.aborted = false;
  }

  propagate(st, todo) {
    const g = this.g, clues = this.clues;
    const stack = Array.from(todo);
    while (stack.length) {
      const e = stack.pop();
      for (const cell of g.edgeCells[e]) {
        const k = clues[cell];
        if (k === null) continue;
        let on = 0, unk = 0;
        for (const f of g.cellEdges[cell]) { if (st[f] === 1) on++; else if (st[f] === -1) unk++; }
        if (on > k || on + unk < k) return false;
        if (unk) {
          let val;
          if (on === k) val = 0;
          else if (on + unk === k) val = 1;
          else continue;
          for (const f of g.cellEdges[cell]) if (st[f] === -1) { st[f] = val; stack.push(f); }
        }
      }
      for (const vt of g.edgeVerts[e]) {
        let on = 0, unk = 0;
        for (const f of g.vertEdges[vt]) { if (st[f] === 1) on++; else if (st[f] === -1) unk++; }
        if (on > 2) return false;
        if (!unk) { if (on === 1) return false; continue; }
        let val;
        if (on === 2) val = 0;
        else if (on === 1 && unk === 1) val = 1;
        else if (on === 0 && unk === 1) val = 0;
        else continue;
        for (const f of g.vertEdges[vt]) if (st[f] === -1) { st[f] = val; stack.push(f); }
      }
    }
    return true;
  }

  /* 'open' | 'closed'(모든 선이 하나의 닫힌 고리) | 'bad'(작은 고리가 따로 생김) */
  loopStatus(st) {
    const g = this.g;
    const parent = new Int32Array(g.nvert);
    for (let i = 0; i < g.nvert; i++) parent[i] = i;
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const onEdges = [];
    for (let e = 0; e < g.ne; e++) if (st[e] === 1) onEdges.push(e);
    let cycleRoot = -1;
    for (const e of onEdges) {
      const [a, b] = g.edgeVerts[e];
      const ra = find(a), rb = find(b);
      if (ra === rb) {
        if (cycleRoot !== -1 && find(cycleRoot) !== ra) return 'bad';
        cycleRoot = ra;
      } else parent[ra] = rb;
    }
    if (cycleRoot === -1) return 'open';
    const root = find(cycleRoot);
    for (const e of onEdges) if (find(g.edgeVerts[e][0]) !== root) return 'bad';
    return 'closed';
  }

  chooseEdge(st) {
    const g = this.g;
    let best = -1, bestUnk = 99;
    for (let vt = 0; vt < g.nvert; vt++) {
      let on = 0, unk = 0, first = -1;
      for (const f of g.vertEdges[vt]) {
        if (st[f] === 1) on++;
        else if (st[f] === -1) { unk++; if (first === -1) first = f; }
      }
      if (on === 1 && unk && unk < bestUnk) {
        best = first; bestUnk = unk;
        if (unk === 2) break;
      }
    }
    if (best !== -1) return best;
    for (const k of [3, 2, 1])
      for (let cell = 0; cell < this.clues.length; cell++)
        if (this.clues[cell] === k)
          for (const f of g.cellEdges[cell]) if (st[f] === -1) return f;
    for (let e = 0; e < g.ne; e++) if (st[e] === -1) return e;
    return -1;
  }

  solve(limit = 2) {
    const st = new Int8Array(this.g.ne).fill(-1);
    const sols = [];
    const all = Array.from({ length: this.g.ne }, (_, i) => i);
    if (!this.propagate(st, all)) return sols;
    this._search(st, sols, limit);
    return sols;
  }

  _search(st, sols, limit) {
    if (sols.length >= limit || this.aborted) return;
    if (++this.nodes > this.nodeLimit) { this.aborted = true; return; }
    const status = this.loopStatus(st);
    if (status === 'bad') return;
    if (status === 'closed') {
      const fin = Array.from(st, s => (s === 1 ? 1 : 0));
      for (let cell = 0; cell < this.clues.length; cell++) {
        const k = this.clues[cell];
        if (k !== null && this.g.cellEdges[cell].reduce((a, f) => a + fin[f], 0) !== k) return;
      }
      sols.push(fin);
      return;
    }
    const e = this.chooseEdge(st);
    if (e === -1) return;
    for (const val of [1, 0]) {
      const s2 = st.slice();
      s2[e] = val;
      if (this.propagate(s2, [e])) {
        this._search(s2, sols, limit);
        if (sols.length >= limit || this.aborted) return;
      }
    }
  }
}

/* 영역(칸 집합)의 경계가 하나의 단순한 고리가 되는지 */
function regionOk(inside, R, C) {
  const W = C + 2, H = R + 2;
  const at = (r, c) => inside[r * W + c];
  for (let r = 0; r < H - 1; r++)
    for (let c = 0; c < W - 1; c++) {
      const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
      if (a === e && b === d && a !== b) return false;      // 꼭짓점에서 4선 교차 금지
    }
  let totalOut = 0;
  for (let i = 0; i < W * H; i++) if (!inside[i]) totalOut++;
  const seen = new Uint8Array(W * H);
  seen[0] = 1;
  const stack = [0];
  let cnt = 1;
  while (stack.length) {
    const p = stack.pop(), r = (p / W) | 0, c = p % W;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
      const q = nr * W + nc;
      if (!seen[q] && !inside[q]) { seen[q] = 1; cnt++; stack.push(q); }
    }
  }
  return cnt === totalOut;                                  // 구멍 없음
}

function generateLoop(grid, rand) {
  const R = grid.R, C = grid.C, n = R * C, W = C + 2;
  let region;
  for (;;) {
    const target = Math.floor(n * (0.45 + rand() * 0.17));
    const inside = new Uint8Array((R + 2) * (C + 2));
    region = new Set();
    const add = (r, c) => { region.add(r * C + c); inside[(r + 1) * W + c + 1] = 1; };
    const del = (r, c) => { region.delete(r * C + c); inside[(r + 1) * W + c + 1] = 0; };
    add(Math.floor(rand() * R), Math.floor(rand() * C));
    let fails = 0;
    while (region.size < target && fails < 300) {
      const cand = new Set();
      for (const cell of region) {
        const r = (cell / C) | 0, c = cell % C;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < R && nc >= 0 && nc < C && !region.has(nr * C + nc)) cand.add(nr * C + nc);
        }
      }
      if (!cand.size) break;
      const list = [...cand];
      const p = list[Math.floor(rand() * list.length)];
      const pr = (p / C) | 0, pc = p % C;
      add(pr, pc);
      if (regionOk(inside, R, C)) fails = 0;
      else { del(pr, pc); fails++; }
    }
    if (region.size >= target * 0.8) break;
  }
  const sol = new Array(grid.ne).fill(0);
  for (let e = 0; e < grid.ne; e++) {
    let ins = 0;
    for (const cell of grid.edgeCells[e]) if (region.has(cell)) ins++;
    sol[e] = ins === 1 ? 1 : 0;
  }
  return sol;
}

function generatePuzzle(R, C, difficulty, rand = Math.random) {
  const grid = new Grid(R, C);
  const sol = generateLoop(grid, rand);
  const clues = grid.cellEdges.map(es => es.reduce((a, e) => a + sol[e], 0));
  const minKeep = Math.floor(R * C * DIFFICULTY[difficulty]);
  const order = Array.from({ length: R * C }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  let kept = R * C;
  for (const cell of order) {
    if (kept <= minKeep) break;
    const k = clues[cell];
    clues[cell] = null;
    const solver = new Solver(grid, clues, 2500);
    const sols = solver.solve(2);
    if (sols.length === 1 && !solver.aborted) kept--;
    else clues[cell] = k;
  }
  return { R, C, difficulty, clues, solution: sol };
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

/* ───────── 공유 링크용 퍼즐 코드 ─────────
 * 예) "7n.2b31a0..."  = 크기 7, 난이도(e/n/h), 칸 숫자 0~3, 빈칸 묶음은 a(1칸)~z(26칸)
 * 정답은 넣지 않는다 (받는 쪽에서 풀어서 유일해인지 다시 확인). */
const DIFF_CODE = { '쉬움': 'e', '보통': 'n', '어려움': 'h' };

function encodePuzzle(n, diff, clues) {
  let s = '', run = 0;
  const flush = () => {
    while (run > 0) { const k = Math.min(run, 26); s += String.fromCharCode(96 + k); run -= k; }
  };
  for (const c of clues) {
    if (c === null) run++;
    else { flush(); s += c; }
  }
  flush();
  return `${n}${DIFF_CODE[diff]}.${s}`;
}

function decodePuzzle(code) {
  const m = /^(\d{1,2})([enh])\.([0-3a-z]{1,400})$/.exec(String(code || ''));
  if (!m) return null;
  const n = Number(m[1]);
  const diff = Object.keys(DIFF_CODE).find((k) => DIFF_CODE[k] === m[2]);
  const clues = [];
  for (const ch of m[3]) {
    if (ch >= 'a') for (let i = 0; i < ch.charCodeAt(0) - 96; i++) clues.push(null);
    else clues.push(Number(ch));
    if (clues.length > n * n) return null;
  }
  if (clues.length !== n * n) return null;
  return { n, diff, clues };
}

if (typeof module !== 'undefined') {
  module.exports = { DIFFICULTY, Grid, Solver, generatePuzzle, encodePuzzle, decodePuzzle, seedRandom };
}
