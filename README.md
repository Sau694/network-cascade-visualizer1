# Network Cascade Visualizer

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)

> **Placement-Level Full-Stack Simulation Tool**: An interactive, high-performance platform for modeling, analyzing, and visualizing cascading behaviors, topological failure propagations, and structural percolation dynamics across complex networks.

---

## 📌 Architecture Overview

The system is architected as a decoupled, full-stack visual simulation engine:

```
┌────────────────────────────────────────────────────────┐
│               React / Vite Frontend                    │
│   (React Flow Canvas · Dynamic Playback · Dashboard)   │
└──────────────────────────┬─────────────────────────────┘
                           │  HTTP / JSON
                           │  POST /api/simulate/cascade
                           ▼
┌────────────────────────────────────────────────────────┐
│               FastAPI Backend Engine                   │
│   (Adjacency Lists · Multi-source BFS/DFS · Models)   │
├────────────────────────────────────────────────────────┤
│ • graph.py       : Undirected weighted adjacency list  │
│ • algorithms.py  : Multi-source BFS and DFS traversals │
│ • simulation.py  : Threshold and Failure cascade logic │
│ • analytics.py   : Degree centrality & partition metrics│
└────────────────────────────────────────────────────────┘
```

- **Frontend**: Single-page application built with React 19, TypeScript, TanStack Start/Router, and `@xyflow/react`. Provides real-time step-by-step canvas animations, interactive node inspection, and analytics dashboards.
- **Backend**: High-throughput FastAPI application exposing RESTful simulation endpoints, processing custom network topologies and calculating cascade step sequences alongside graph-theoretic centrality metrics.

---

## ⚡ Core Features & Algorithmic Implementations

### 1. Graph Data Structure & Representation (`graph.py`)
- Custom **undirected weighted graph** implemented using an internal hash-map adjacency list:
  $$\text{Adj}(u) = \{ v \mid (u, v) \in E \}$$
- Dynamic node thresholds $\theta_v \in [0.0, 1.0]$ and edge weights $w(u, v) \ge 0$.
- O(1) degree querying, neighbor lookup, and symmetric edge weight tracking.

### 2. Multi-Source Graph Traversals (`algorithms.py`)
- **Multi-Source Breadth-First Search (BFS)**:
  - Discovers shortest-path layer horizons simultaneously from arbitrary seed subsets.
  - Computes parent pointer trees, visit orders, and level depths $d(v)$.
- **Multi-Source Depth-First Search (DFS)**:
  - Iterative DFS maintaining parent paths and branch depths without recursion overhead.

### 3. Cascade Propagation Models (`simulation.py`)
- **Threshold Cascade Model (Granovetter / Watts Model)**:
  - A node $v$ activates at step $t+1$ if the fraction of its active neighbors meets or exceeds its internal threshold:
    $$\frac{|\{ u \in \text{Neighbors}(v) \mid u \text{ is active at } t \}|}{|\text{Neighbors}(v)|} \ge \theta_v$$
  - Supports both synchronous wavefront expansion (BFS-style) and localized sequential activation (DFS-ordered).
- **Failure & Load Redistribution Cascade (Motter-Lai Model)**:
  - Initial load assigned proportional to degree: $L_v = \text{deg}(v)$.
  - Capacity defined with tolerance headroom:
    $$C_v = \max(\text{deg}(v), 1) \cdot \left(1 + (1 - \theta_v)\right)$$
  - When seed nodes fail, their active load redistributes equally across surviving neighbors weighted by edge values.
  - Overloaded nodes ($L_v > C_v$) fail recursively in subsequent steps, triggering secondary failures until reaching topological equilibrium.

### 4. Graph Analytics & Percolation Metrics (`analytics.py`)
- **Degree Centrality**:
  $$C_D(v) = \frac{\text{deg}(v)}{|V| - 1}$$
- **Connected Components**: Breadth-first component labeling measuring graph fragmentation and surviving partition sizes post-cascade.
- **Cascade Metrics**:
  - Total Cascade Size ($|S_{\text{affected}}|$).
  - Cascade Infiltration Spread ($\frac{|S_{\text{affected}}|}{|V|}$).
  - Maximum Propagation Depth ($\max_{v \in S} d(v)$).
  - Iteration steps to convergence.

---

## 🛠 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, `@xyflow/react` (React Flow), Tailwind CSS 4, Lucide Icons, Sonner |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Uvicorn (ASGI) |
| **Testing** | Vitest, Pytest |
| **Styling** | Modern dark-palette dashboard adhering to strict tabular typography (`JetBrains Mono`, `Inter Tight`) |

---

## 🚀 Local Setup & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm / bun

### 1. Backend Setup (FastAPI)
```powershell
# Navigate into backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
> The API will be running locally at `http://127.0.0.1:8000`. You can inspect interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (React / Vite)
```powershell
# In a new terminal window, navigate into frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> Open your browser at `http://localhost:3000` (or the port indicated by Vite).

---

## 🧭 Dashboard Guide & Usage

The application features a 3-tab workspace accessible via the left sidebar:

### 1. Simulator Workspace
- **Presets**: Choose from built-in graph presets including *Small Network*, *Social Communities*, *Linear Chain*, *Hub-and-Spoke*, and *Random ER Graph*.
- **Configuration Panel**:
  - **Start Node**: Select the initial seed node (or click any node on the graph canvas directly).
  - **Algorithm**: Toggle between `BFS` (breadth-first synchronous wave) and `DFS` (depth-first sequential wave).
  - **Cascade Model**: Select `Threshold` (social influence model) or `Failure` (infrastructure load overload model).
  - **Speed Slider**: Dynamically adjust playback rate from `1%` (~1.5s/step) up to `100%` (~120ms/step).
- **Playback Controls**:
  - `Start`: Triggers real-time simulation on FastAPI and animates step sequences.
  - `Pause`: Pauses step execution at any point.
  - `Reset`: Cleans state and restores initial node statuses.
- **Canvas Visuals**: Green indicates active seeds, glowing animated edges mark cascade paths, and amber highlights newly affected nodes.

### 2. Network Analytics Workspace
- Displays quantitative topological analytics returned directly by FastAPI:
  - **KPI Cards**: Cascade Size, Infiltration Spread %, Max Depth, Iterations, and Partition Components.
  - **Degree Centrality Table**: Real-time sorting and visual centrality bars for every node in the graph.
  - **Partition Groups**: Explicit list of connected component subgraphs surviving the cascade.
  - **Traversal Sequences**: Chronological BFS and DFS node evaluation traces.

### 3. Settings Workspace
- **API Endpoint Configuration**: Easily configure or switch the backend URL (defaults to live Render backend `https://network-cascade-backend.onrender.com/api` with local fallback `http://127.0.0.1:8000/api`).
- **Connection Test**: One-click health ping checking FastAPI connectivity with real-time status alerts.
- **Defaults**: Customize simulation step limits and reset simulation engine state.

---

## 🧪 Testing

### Frontend Tests
```powershell
cd frontend
npm run test          # Run Vitest test suite
npx tsc --noEmit      # Run TypeScript compilation validation
npm run build         # Test production build
```

---

## 📄 License
MIT License. Built for placement-level network cascade visual analysis and portfolio demonstration.
