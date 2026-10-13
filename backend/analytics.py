from __future__ import annotations

from collections import deque

from graph import Graph


def degree_centrality(graph: Graph) -> dict[str, float]:
    n = len(graph.node_ids)
    if n <= 1:
        return {node_id: 0.0 for node_id in graph.node_ids}
    denom = n - 1
    return {
        node_id: round(graph.degree(node_id) / denom, 6)
        for node_id in graph.node_ids
    }


def connected_components(graph: Graph, excluded: set[str] | None = None) -> dict:
    excluded = excluded or set()
    visited: set[str] = set()
    components: list[list[str]] = []

    for node_id in graph.node_ids:
        if node_id in visited or node_id in excluded:
            continue
        bucket: list[str] = []
        queue: deque[str] = deque([node_id])
        visited.add(node_id)
        while queue:
            current = queue.popleft()
            bucket.append(current)
            for neighbor in graph.neighbors(current):
                if neighbor in visited or neighbor in excluded:
                    continue
                visited.add(neighbor)
                queue.append(neighbor)
        components.append(sorted(bucket))

    components.sort(key=lambda c: (-len(c), c[0] if c else ""))
    return {
        "count": len(components),
        "sizes": [len(c) for c in components],
        "components": components,
    }


def cascade_metrics(
    graph: Graph,
    affected: set[str],
    steps: list[dict],
    bfs_depth: dict[str, int],
    failed: set[str],
) -> dict:
    n = len(graph.node_ids) or 1
    depths = [bfs_depth.get(node_id, 0) for node_id in affected]
    max_depth = max(depths, default=0)
    cascade_size = len(affected)
    return {
        "total_cascade_size": cascade_size,
        "max_depth": max_depth,
        "cascade_spread": round(cascade_size / n, 6),
        "steps_taken": max(0, len(steps) - 1),
        "degree_centrality": degree_centrality(graph),
        "connected_components": connected_components(graph, excluded=failed),
        "original_connected_components": connected_components(graph),
        "mean_degree": round(
            sum(graph.degree(node_id) for node_id in graph.node_ids) / n,
            6,
        ),
    }
