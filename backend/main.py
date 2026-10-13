from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from analytics import cascade_metrics
from graph import Graph
from simulation import run_failure_cascade, run_threshold_cascade, traversal_from_seeds

app = FastAPI(title="Cascade Network Analyzer API")

# Enable CORS so your React/Vite frontend can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    id: str
    label: Optional[str] = None
    threshold: Optional[float] = 0.5


class Edge(BaseModel):
    source: str
    target: str
    weight: Optional[float] = 1.0


class NetworkData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    preset: Optional[str] = "custom"


class SimulationRequest(BaseModel):
    network: NetworkData
    seed_nodes: List[str]
    model_type: str  # "threshold" or "failure"
    max_steps: Optional[int] = 10
    algorithm: Optional[str] = "bfs"


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running smoothly!"}


@app.post("/api/simulate/cascade")
def run_cascade_simulation(payload: SimulationRequest):
    model_type = (payload.model_type or "").strip().lower()
    algorithm = (payload.algorithm or "bfs").strip().lower()
    max_steps = 10 if payload.max_steps is None else payload.max_steps

    if model_type not in {"threshold", "failure"}:
        raise HTTPException(status_code=400, detail='model_type must be "threshold" or "failure"')
    if algorithm not in {"bfs", "dfs"}:
        raise HTTPException(status_code=400, detail='algorithm must be "bfs" or "dfs"')
    if max_steps < 0:
        raise HTTPException(status_code=400, detail="max_steps must be >= 0")
    if not payload.network.nodes:
        raise HTTPException(status_code=400, detail="network.nodes cannot be empty")
    if not payload.seed_nodes:
        raise HTTPException(status_code=400, detail="seed_nodes cannot be empty")

    graph = Graph(payload.network.nodes, payload.network.edges)
    missing = [seed for seed in payload.seed_nodes if seed not in graph.adj]
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown seed nodes: {missing}")

    seeds = list(dict.fromkeys(payload.seed_nodes))
    traversal = traversal_from_seeds(graph, seeds)

    if model_type == "threshold":
        result = run_threshold_cascade(graph, seeds, max_steps, algorithm)
    else:
        result = run_failure_cascade(graph, seeds, max_steps, algorithm)

    analytics = cascade_metrics(
        graph,
        affected=result["affected"],
        steps=result["steps"],
        bfs_depth=traversal["bfs_depth"],
        failed=result["failed"],
    )
    analytics["adjacency_list"] = graph.adjacency_list()
    analytics["bfs_order"] = traversal["bfs_order"]
    analytics["dfs_order"] = traversal["dfs_order"]

    return {
        "success": True,
        "model_type": model_type,
        "algorithm": algorithm,
        "steps": result["steps"],
        "analytics": analytics,
    }
