from __future__ import annotations

from collections import defaultdict


class Graph:
    """Undirected weighted graph with an adjacency list."""

    def __init__(self, nodes: list, edges: list) -> None:
        self.node_ids: list[str] = []
        self.labels: dict[str, str] = {}
        self.thresholds: dict[str, float] = {}
        self.adj: dict[str, list[str]] = {}
        self.weights: dict[tuple[str, str], float] = {}

        seen: set[str] = set()
        for node in nodes:
            if node.id in seen:
                continue
            seen.add(node.id)
            self.node_ids.append(node.id)
            self.labels[node.id] = node.label or node.id
            threshold = 0.5 if node.threshold is None else float(node.threshold)
            self.thresholds[node.id] = min(1.0, max(0.0, threshold))
            self.adj[node.id] = []

        neighbors: dict[str, set[str]] = defaultdict(set)
        for edge in edges:
            src, dst = edge.source, edge.target
            if src not in seen or dst not in seen or src == dst:
                continue
            weight = 1.0 if edge.weight is None else float(edge.weight)
            neighbors[src].add(dst)
            neighbors[dst].add(src)
            key = _undirected_key(src, dst)
            self.weights[key] = weight

        for node_id in self.node_ids:
            self.adj[node_id] = sorted(neighbors[node_id])

    def neighbors(self, node_id: str) -> list[str]:
        return self.adj.get(node_id, [])

    def degree(self, node_id: str) -> int:
        return len(self.neighbors(node_id))

    def edge_weight(self, a: str, b: str) -> float:
        return self.weights.get(_undirected_key(a, b), 1.0)

    def adjacency_list(self) -> dict[str, list[str]]:
        return {node_id: list(nbrs) for node_id, nbrs in self.adj.items()}


def _undirected_key(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a <= b else (b, a)
