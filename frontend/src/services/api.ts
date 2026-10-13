import type { Network } from "@/lib/graph-data";

export interface BackendNode {
  id: string;
  label?: string;
  threshold?: number;
}

export interface BackendEdge {
  source: string;
  target: string;
  weight?: number;
}

export interface NetworkPayload {
  nodes: BackendNode[];
  edges: BackendEdge[];
  preset?: string;
}

export interface SimulationRequest {
  network: NetworkPayload;
  seed_nodes: string[];
  model_type: "threshold" | "failure";
  max_steps?: number;
  algorithm?: "bfs" | "dfs";
}

export interface SimulationStep {
  step: number;
  active_nodes: string[];
  failed_nodes: string[];
  newly_activated?: string[];
  newly_failed?: string[];
}

export interface ConnectedComponentsData {
  count: number;
  sizes: number[];
  components: string[][];
}

export interface CascadeAnalytics {
  total_cascade_size: number;
  max_depth: number;
  cascade_spread: number;
  steps_taken: number;
  degree_centrality: Record<string, number>;
  connected_components: ConnectedComponentsData;
  original_connected_components: ConnectedComponentsData;
  mean_degree: number;
  adjacency_list: Record<string, string[]>;
  bfs_order: string[];
  dfs_order: string[];
}

export interface SimulationResponse {
  success: boolean;
  model_type: string;
  algorithm: string;
  steps: SimulationStep[];
  analytics: CascadeAnalytics;
}

export function getBaseApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("cascade_api_url");
    if (saved) {
      const trimmed = saved.trim().replace(/\/+$/, "");
      return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
    }
  }
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env["VITE_API_URL"] || import.meta.env["VITE_API_BASE_URL"])) ||
    "http://127.0.0.1:8000";
  const trimmed = String(envUrl).trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function setCustomApiUrl(url: string | null): void {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem("cascade_api_url", url.trim());
    } else {
      localStorage.removeItem("cascade_api_url");
    }
  }
}

/**
 * Check if the FastAPI backend is running and reachable.
 */
export async function checkBackendHealth(): Promise<{ status: string; message: string }> {
  const url = `${getBaseApiUrl()}/health`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Backend health check failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Trigger cascade simulation on the FastAPI backend.
 */
export async function runCascadeSimulation(payload: SimulationRequest): Promise<SimulationResponse> {
  const url = `${getBaseApiUrl()}/simulate/cascade`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Simulation failed with HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore JSON parse error and use status message
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Serializes frontend graph state into the payload structure required by FastAPI.
 */
export function formatNetworkForBackend(network: Network, preset = "custom"): NetworkPayload {
  const nodes: BackendNode[] = network.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    threshold: n.influence !== undefined ? n.influence : 0.5,
  }));

  const edges: BackendEdge[] = network.edges.map(([source, target]) => ({
    source,
    target,
    weight: 1.0,
  }));

  return {
    nodes,
    edges,
    preset,
  };
}
