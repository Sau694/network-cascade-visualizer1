from __future__ import annotations

from collections import deque

from algorithms import bfs, dfs
from graph import Graph


def run_threshold_cascade(graph: Graph, seeds: list[str], max_steps: int, algorithm: str) -> dict:
    """Activate a node when the fraction of active neighbors meets its threshold."""
    active: set[str] = set(seeds)
    steps = [_step(0, active_nodes=sorted(active), failed_nodes=[], newly_activated=sorted(active))]

    if algorithm == "dfs":
        _threshold_async(graph, active, steps, max_steps, use_dfs=True)
    else:
        _threshold_sync(graph, active, steps, max_steps)

    return {
        "steps": steps,
        "affected": set(active),
        "active": set(active),
        "failed": set(),
    }


def run_failure_cascade(graph: Graph, seeds: list[str], max_steps: int, algorithm: str) -> dict:
    """Redistribute load after failures; nodes fail when load exceeds capacity.

    Initial load is degree. Capacity is (1 + (1 - threshold)) * max(degree, 1),
    so a 0.5 threshold means 50% spare capacity over initial load.
    """
    failed: set[str] = set(seeds)
    load = {node_id: float(graph.degree(node_id)) for node_id in graph.node_ids}
    capacity = {
        node_id: max(graph.degree(node_id), 1) * (1.0 + (1.0 - graph.thresholds[node_id]))
        for node_id in graph.node_ids
    }

    operational = [node_id for node_id in graph.node_ids if node_id not in failed]
    steps = [
        _step(
            0,
            active_nodes=sorted(operational),
            failed_nodes=sorted(failed),
            newly_failed=sorted(failed),
        )
    ]

    pending: deque[str] = deque(reversed(seeds)) if algorithm == "dfs" else deque(seeds)

    for step_no in range(1, max_steps + 1):
        overflow: list[str] = []
        processed: set[str] = set()

        while pending:
            node_id = pending.pop() if algorithm == "dfs" else pending.popleft()
            if node_id in processed:
                continue
            processed.add(node_id)
            living = [nbr for nbr in graph.neighbors(node_id) if nbr not in failed]
            if not living:
                continue
            share = load[node_id] / len(living)
            for neighbor in living:
                load[neighbor] += share * graph.edge_weight(node_id, neighbor)
                if neighbor not in failed and load[neighbor] > capacity[neighbor] + 1e-9:
                    overflow.append(neighbor)

        newly: list[str] = []
        seen_new: set[str] = set()
        for node_id in overflow:
            if node_id in failed or node_id in seen_new:
                continue
            seen_new.add(node_id)
            newly.append(node_id)

        if not newly:
            break

        failed.update(newly)
        pending = deque(newly)
        operational = [node_id for node_id in graph.node_ids if node_id not in failed]
        steps.append(
            _step(
                step_no,
                active_nodes=sorted(operational),
                failed_nodes=sorted(failed),
                newly_failed=sorted(newly),
            )
        )

    remaining = {node_id for node_id in graph.node_ids if node_id not in failed}
    return {
        "steps": steps,
        "affected": set(failed),
        "active": remaining,
        "failed": set(failed),
    }


def traversal_from_seeds(graph: Graph, seeds: list[str]) -> dict:
    bfs_result = bfs(graph, seeds)
    dfs_result = dfs(graph, seeds)
    return {
        "bfs_order": bfs_result["order"],
        "dfs_order": dfs_result["order"],
        "bfs_depth": bfs_result["depth"],
        "dfs_depth": dfs_result["depth"],
    }


def _threshold_sync(graph: Graph, active: set[str], steps: list[dict], max_steps: int) -> None:
    for step_no in range(1, max_steps + 1):
        newly: list[str] = []
        for node_id in graph.node_ids:
            if node_id in active:
                continue
            nbrs = graph.neighbors(node_id)
            if not nbrs:
                continue
            fraction = sum(1 for nbr in nbrs if nbr in active) / len(nbrs)
            if fraction + 1e-12 >= graph.thresholds[node_id]:
                newly.append(node_id)
        if not newly:
            break
        active.update(newly)
        steps.append(
            _step(step_no, active_nodes=sorted(active), failed_nodes=[], newly_activated=sorted(newly))
        )


def _threshold_async(graph: Graph, active: set[str], steps: list[dict], max_steps: int, use_dfs: bool) -> None:
    """Activate one qualifying node per step, ordered by DFS or BFS from current seeds."""
    for step_no in range(1, max_steps + 1):
        qualifying: list[str] = []
        for node_id in graph.node_ids:
            if node_id in active:
                continue
            nbrs = graph.neighbors(node_id)
            if not nbrs:
                continue
            fraction = sum(1 for nbr in nbrs if nbr in active) / len(nbrs)
            if fraction + 1e-12 >= graph.thresholds[node_id]:
                qualifying.append(node_id)
        if not qualifying:
            break

        origins = sorted(active)
        if use_dfs:
            rank = {nid: i for i, nid in enumerate(dfs(graph, origins)["order"])}
            chosen = min(qualifying, key=lambda nid: (rank.get(nid, 10**9), nid))
        else:
            depth = bfs(graph, origins)["depth"]
            chosen = min(qualifying, key=lambda nid: (depth.get(nid, 10**9), nid))

        active.add(chosen)
        steps.append(
            _step(step_no, active_nodes=sorted(active), failed_nodes=[], newly_activated=[chosen])
        )


def _step(
    step: int,
    active_nodes: list[str],
    failed_nodes: list[str],
    newly_activated: list[str] | None = None,
    newly_failed: list[str] | None = None,
) -> dict:
    payload = {
        "step": step,
        "active_nodes": active_nodes,
        "failed_nodes": failed_nodes,
    }
    if newly_activated is not None:
        payload["newly_activated"] = newly_activated
    if newly_failed is not None:
        payload["newly_failed"] = newly_failed
    return payload
