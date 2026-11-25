/* 퍼즐 생성은 백그라운드 스레드에서 (화면이 멈추지 않도록) */
importScripts('core.js');
onmessage = (ev) => {
  const { id, n, diff } = ev.data;
  postMessage({ id, puzzle: generatePuzzle(n, n, diff) });
};
