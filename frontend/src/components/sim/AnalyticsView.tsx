import { useMemo } from "react";
import { FlaskConical, GitFork, Network as NetIcon, Layers, Activity } from "lucide-react";
import type { Network, NodeStatus } from "@/lib/graph-data";
import type { CascadeAnalytics } from "@/services/api";
import { neighborsOf } from "@/lib/graph-data";
import { cn } from "@/lib/utils";

interface AnalyticsViewProps {
  network: Network;
  analytics: CascadeAnalytics | null;
  onSwitchToSimulator: () => void;
}

const statusDot: Record<NodeStatus, string> = {
  active: "bg-active",
  affected: "bg-affected",
  inactive: "bg-inactive",
};

export function AnalyticsView({ network, analytics, onSwitchToSimulator }: AnalyticsViewProps) {
  // Baseline degree calculation for fallback when no simulation has been run yet
  const fallbackCentrality = useMemo(() => {
    const n = network.nodes.length;
    if (n <= 1) return {};
    const denom = n - 1;
    const res: Record<string, number> = {};
    for (const node of network.nodes) {
      const deg = neighborsOf(network, node.id).length;
      res[node.id] = Number((deg / denom).toFixed(4));
    }
    return res;
  }, [network]);

  const centrality = analytics?.degree_centrality || fallbackCentrality;

  // Nodes sorted by degree centrality
  const rankedNodes = useMemo(() => {
    return [...network.nodes].sort((a, b) => (centrality[b.id] ?? 0) - (centrality[a.id] ?? 0));
  }, [network.nodes, centrality]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {/* Simulation Status Banner */}
      {!analytics && (
        <div className="panel flex flex-col items-start justify-between gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Showing baseline network topology metrics</p>
              <p className="text-[12px] text-muted-foreground">
                Run a simulation in the Simulator to inspect dynamic cascade propagation depth, spread, and post-cascade partition metrics.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToSimulator}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Run in Simulator
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Cascade Size"
          value={analytics ? `${analytics.total_cascade_size} / ${network.nodes.length}` : `${network.nodes.length} nodes`}
          subtext={analytics ? `${Math.round(analytics.cascade_spread * 100)}% affected` : "Full network"}
          dot={analytics ? "bg-affected" : undefined}
        />
        <MetricCard
          label="Cascade Spread"
          value={analytics ? `${(analytics.cascade_spread * 100).toFixed(1)}%` : "0%"}
          subtext={analytics ? "Infiltration ratio" : "Not yet run"}
        />
        <MetricCard
          label="Max Depth"
          value={analytics ? `${analytics.max_depth}` : "—"}
          subtext={analytics ? "Propagation levels" : "Awaiting run"}
        />
        <MetricCard
          label="Steps Taken"
          value={analytics ? `${analytics.steps_taken}` : "—"}
          subtext={analytics ? "Algorithm iterations" : "Awaiting run"}
        />
        <MetricCard
          label="Components"
          value={analytics ? `${analytics.connected_components.count}` : "1"}
          subtext={analytics ? `Orig: ${analytics.original_connected_components.count}` : "Connected"}
        />
        <MetricCard
          label="Mean Degree"
          value={analytics ? `${analytics.mean_degree.toFixed(2)}` : (network.edges.length * 2 / Math.max(1, network.nodes.length)).toFixed(2)}
          subtext="Avg connections"
        />
      </div>

      {/* Centrality Table & Connected Components */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Centrality Table (Takes 2 cols on lg) */}
        <section className="panel flex flex-col overflow-hidden lg:col-span-2">
          <div className="flex h-11 items-center justify-between border-b border-border px-4">
            <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <NetIcon className="h-3.5 w-3.5" />
              Degree Centrality Ranking
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">{network.nodes.length} nodes ranked</span>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 border-b border-border bg-surface font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Rank</th>
                  <th className="px-4 py-2.5 font-medium">Node</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Degree</th>
                  <th className="px-4 py-2.5 font-medium">Centrality Score</th>
                  <th className="px-4 py-2.5 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rankedNodes.map((n, idx) => {
                  const score = centrality[n.id] ?? 0;
                  const deg = neighborsOf(network, n.id).length;
                  return (
                    <tr key={n.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">#{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-medium">{n.id}</span>
                        <span className="ml-2 text-muted-foreground">({n.label})</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5 capitalize text-[12px]">
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[n.status])} />
                          {n.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px]">{deg}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(100, score * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[12px]">{score.toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                        {n.influence?.toFixed(2) ?? "0.50"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Components & Traversal Order Card (Takes 1 col on lg) */}
        <div className="flex flex-col gap-4">
          {/* Connected Components */}
          <section className="panel flex flex-col">
            <div className="flex h-11 items-center justify-between border-b border-border px-4">
              <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Connected Components
              </h2>
              <span className="font-mono text-[11px] text-muted-foreground">
                {analytics?.connected_components.count ?? 1} groups
              </span>
            </div>
            <div className="space-y-3 p-4">
              {analytics ? (
                analytics.connected_components.components.map((comp, i) => (
                  <div key={i} className="rounded-sm border border-border bg-background p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-foreground">Component #{i + 1}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{comp.length} nodes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {comp.map((nid) => (
                        <span key={nid} className="rounded-xs border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
                          {nid}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  The original preset currently has 1 connected component containing all {network.nodes.length} nodes.
                </p>
              )}
            </div>
          </section>

          {/* Traversal Order Card */}
          {analytics && (
            <section className="panel flex flex-col">
              <div className="flex h-11 items-center justify-between border-b border-border px-4">
                <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <GitFork className="h-3.5 w-3.5" />
                  Traversal Sequence
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">Order</span>
              </div>
              <div className="space-y-3 p-4 text-[12px]">
                <div>
                  <p className="mb-1 font-semibold text-foreground">BFS Visit Sequence:</p>
                  <p className="rounded-sm border border-border bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {analytics.bfs_order.join(" → ") || "None"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-foreground">DFS Visit Sequence:</p>
                  <p className="rounded-sm border border-border bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {analytics.dfs_order.join(" → ") || "None"}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  dot,
}: {
  label: string;
  value: string | number;
  subtext?: string | undefined;
  dot?: string | undefined;
}) {
  return (
    <div className="panel px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-medium tabular-nums">{value}</p>
      {subtext && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtext}</p>}
    </div>
  );
}
