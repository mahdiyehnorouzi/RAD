// Generates torn paper outlines for the passport page.
let seed = 41;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const f = (n) => Number(n.toFixed(1));

// Across the top of the sheet. The rim lifts near x=0 like a peeled corner.
function top(width, height, base, lift) {
  const rim = [];
  const edge = [];
  let x = 0;
  let drift = 0;
  while (x <= width) {
    drift = Math.max(-3, Math.min(3, drift + (rand() - 0.5) * 2.4));
    const curl = Math.max(0, 1 - x / (width * 0.16));
    const r = base + drift - curl * curl * lift;
    rim.push([x, r]);
    edge.push([x, r + 2.2 + rand() * 2.4 + curl * 3]);
    x += 3 + rand() * 6;
  }
  rim.push([width, rim.at(-1)[1]]);
  edge.push([width, edge.at(-1)[1]]);
  const path = (pts) =>
    `M0 ${height}V${f(pts[0][1])}` +
    pts.map(([px, py]) => `L${f(px)} ${f(py)}`).join("") +
    `V${height}Z`;
  return { viewBox: `0 0 ${width} ${height}`, rim: path(rim), edge: path(edge) };
}

// Down the inline-end side of the sheet; fill sits on the right.
function side(width, height) {
  const rim = [];
  const edge = [];
  let y = 0;
  let drift = 0;
  while (y <= height) {
    drift = Math.max(-4, Math.min(4, drift + (rand() - 0.5) * 2.6));
    const r = width * 0.35 + drift;
    rim.push([r, y]);
    edge.push([r + 2.4 + rand() * 2.6, y]);
    y += 3 + rand() * 6;
  }
  rim.push([rim.at(-1)[0], height]);
  edge.push([edge.at(-1)[0], height]);
  const path = (pts) =>
    `M${width} 0H${f(pts[0][0])}` +
    pts.map(([px, py]) => `L${f(px)} ${f(py)}`).join("") +
    `H${width}Z`;
  return { viewBox: `0 0 ${width} ${height}`, rim: path(rim), edge: path(edge) };
}

console.log(
  JSON.stringify(
    { cover: top(400, 40, 22, 18), side: side(24, 600) },
    null,
    2,
  ),
);
