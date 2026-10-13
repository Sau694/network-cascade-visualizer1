// Mock network presets. Replace with real data source / simulation engine later.
export type NodeStatus = "active" | "inactive" | "affected";

export interface NetNode {
  id: string;
  label: string;
  status: NodeStatus;
  influence: number;
  x: number;
  y: number;
}

export interface Network {
  nodes: NetNode[];
  edges: [string, string][];
}

export type PresetId = "small" | "social" | "chain" | "hub" | "random";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "small", label: "Small Network" },
  { id: "social", label: "Social Network" },
  { id: "chain", label: "Chain" },
  { id: "hub", label: "Hub Network" },
  { id: "random", label: "Random Network" },
];

// Deterministic PRNG so presets render the same each time.
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const STATUSES: NodeStatus[] = ["active", "inactive", "inactive", "affected"];

function mkNodes(pts: [number, number][], labels: string[], seed: number): NetNode[] {
  const r = rng(seed);
  return pts.map(([x, y], i) => ({
    id: `N${i + 1}`,
    label: labels[i % labels.length] + (i >= labels.length ? ` ${Math.floor(i / labels.length) + 1}` : ""),
    status: STATUSES[Math.floor(r() * STATUSES.length)] ?? "inactive",
    influence: Math.round((0.15 + r() * 0.8) * 100) / 100,
    x, y,
  }));
}

const circle = (n: number, rad: number, cx = 400, cy = 300): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  });

const SMALL: Network = {
  nodes: mkNodes(
    [[380, 220], [160, 100], [600, 90], [40, 260], [220, 360], [540, 330], [760, 220], [420, 480], [660, 500], [120, 500], [860, 400], [380, 0]],
    ["Core Router", "Gateway A", "Gateway B", "Edge 01", "Edge 02", "Cache", "Auth Svc", "DB Primary", "DB Replica", "Queue", "Worker", "CDN"],
    7,
  ),
  edges: [
    ["N1", "N2"], ["N1", "N3"], ["N1", "N5"], ["N1", "N6"], ["N1", "N8"], ["N1", "N12"],
    ["N2", "N4"], ["N2", "N12"], ["N3", "N7"], ["N3", "N12"], ["N5", "N10"], ["N6", "N7"],
    ["N6", "N9"], ["N8", "N9"], ["N8", "N10"], ["N7", "N11"], ["N9", "N11"],
  ],
};

function social(): Network {
  // Two communities joined by a few bridges.
  const a = circle(7, 150, 220, 300), b = circle(7, 150, 640, 300);
  const nodes = mkNodes([...a, ...b], ["Ava", "Ben", "Cleo", "Dev", "Eli", "Fay", "Gus", "Hana", "Ivo", "Jun", "Kai", "Lia", "Max", "Noa"], 11);
  const r = rng(3), edges: [string, string][] = [];
  for (const off of [0, 7]) for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++)
    if (r() < 0.45 || j === i + 1) edges.push([`N${i + 1 + off}`, `N${j + 1 + off}`]);
  edges.push(["N2", "N14"], ["N3", "N13"], ["N4", "N10"]);
  return { nodes, edges };
}

function chain(): Network {
  const pts: [number, number][] = Array.from({ length: 10 }, (_, i) => [i * 110, 300 + (i % 2 ? 60 : -60)]);
  const nodes = mkNodes(pts, ["Stage"], 5).map((n, i) => ({ ...n, label: `Stage ${i + 1}` }));
  return { nodes, edges: nodes.slice(1).map((n, i) => [`N${i + 1}`, n.id] as [string, string]) };
}

function hub(): Network {
  const pts: [number, number][] = [[400, 300], ...circle(11, 260)];
  const nodes = mkNodes(pts, ["Hub", ...Array.from({ length: 11 }, (_, i) => `Leaf ${i + 1}`)], 9);
  const h = nodes[0]; if (h) { h.status = "active"; h.influence = 0.97; }
  const edges: [string, string][] = nodes.slice(1).map((n) => ["N1", n.id]);
  edges.push(["N2", "N3"], ["N6", "N7"], ["N10", "N11"]);
  return { nodes, edges };
}

function random(): Network {
  const r = rng(Date.now() % 100000 || 1);
  const n = 10 + Math.floor(r() * 5);
  const pts: [number, number][] = Array.from({ length: n }, () => [r() * 800, r() * 560]);
  const nodes = mkNodes(pts, ["Node"], Math.floor(r() * 1000) + 1).map((x, i) => ({ ...x, label: `Node ${i + 1}` }));
  const set = new Set<string>(), edges: [string, string][] = [];
  const add = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a !== b && !set.has(k)) { set.add(k); edges.push([`N${a + 1}`, `N${b + 1}`]); }
  };
  for (let i = 1; i < n; i++) add(i, Math.floor(r() * i)); // ensure connected
  for (let i = 0; i < n; i++) add(Math.floor(r() * n), Math.floor(r() * n));
  return { nodes, edges };
}

export function getPreset(id: PresetId): Network {
  switch (id) {
    case "small": return SMALL;
    case "social": return social();
    case "chain": return chain();
    case "hub": return hub();
    case "random": return random();
  }
}

export const neighborsOf = (net: Network, id: string) =>
  net.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
