/* 무거운 계산은 백그라운드 스레드에서 (화면이 멈추지 않도록)
 *  - gen   : 새 퍼즐 생성 (seed 가 있으면 오늘의 퍼즐처럼 항상 같은 퍼즐)
 *  - solve : 공유받은 퍼즐 풀기 (정답이 하나뿐인지 확인) */
importScripts('core.js');

function solveShared(n, clues) {
  const s = new Solver(new Grid(n, n), clues, 300000);
  const sols = s.solve(2);
  return { count: s.aborted ? -1 : sols.length, solution: sols[0] || null };
}

onmessage = (ev) => {
  const d = ev.data;
  if (d.type === 'solve') postMessage({ id: d.id, ...solveShared(d.n, d.clues) });
  else postMessage({ id: d.id, puzzle: generatePuzzle(d.n, d.n, d.diff, d.seed ? seedRandom(d.seed) : Math.random) });
};
