from __future__ import annotations

from collections import deque

from graph import Graph


def bfs(graph: Graph, seeds: list[str]) -> dict:
    """Multi-source BFS. Returns visit order, parent pointers, and depths."""
    visited: set[str] = set()
    order: list[str] = []
    parent: dict[str, str | None] = {}
    depth: dict[str, int] = {}
    queue: deque[str] = deque()

    for seed in seeds:
        if seed not in graph.adj or seed in visited:
            continue
        visited.add(seed)
        parent[seed] = None
        depth[seed] = 0
        queue.append(seed)
        order.append(seed)

    while queue:
        current = queue.popleft()
        for neighbor in graph.neighbors(current):
            if neighbor in visited:
                continue
            visited.add(neighbor)
            parent[neighbor] = current
            depth[neighbor] = depth[current] + 1
            queue.append(neighbor)
            order.append(neighbor)

    return {
        "order": order,
        "parent": parent,
        "depth": depth,
        "visited": visited,
    }


def dfs(graph: Graph, seeds: list[str]) -> dict:
    """Multi-source iterative DFS. Returns visit order, parent pointers, and depths."""
    visited: set[str] = set()
    order: list[str] = []
    parent: dict[str, str | None] = {}
    depth: dict[str, int] = {}
    stack: list[tuple[str, str | None, int]] = []

    for seed in reversed(seeds):
        if seed in graph.adj:
            stack.append((seed, None, 0))

    while stack:
        current, prev, level = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        parent[current] = prev
        depth[current] = level
        order.append(current)
        for neighbor in reversed(graph.neighbors(current)):
            if neighbor not in visited:
                stack.append((neighbor, current, level + 1))

    return {
        "order": order,
        "parent": parent,
        "depth": depth,
        "visited": visited,
    }
