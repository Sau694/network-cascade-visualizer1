import { useState } from "react";
import { Play, Pause, RotateCcw, Network as NetIcon, FlaskConical, BarChart3, Settings } from "lucide-react";
import { neighborsOf, type Network, type NodeStatus } from "@/lib/graph-data";
import type { CascadeAnalytics } from "@/services/api";
import type { EngineStatus } from "@/hooks/useCascadeSimulation";
import { cn } from "@/lib/utils";

export type SidebarTab = "simulator" | "analytics" | "settings";

export function Sidebar({
  activeTab = "simulator",
  onTabChange,
  engineStatus = "idle",
}: {
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  engineStatus?: EngineStatus;
}) {
  const items: { id: SidebarTab; icon: typeof FlaskConical; label: string }[] = [
    { id: "simulator", icon: FlaskConical, label: "Simulator" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary">
          <NetIcon className="h-4 w-4 text-primary-foreground" />
        </div>
        <p className="min-w-0 truncate text-[13px] font-semibold tracking-tight">Network Cascade Visualizer</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Workspace</p>
        {items.map(({ id, icon: I, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange?.(id)}
              className={cn(
                "relative flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors text-left",
                active
                  ? "bg-muted text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:bg-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <I className="h-4 w-4" /> {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-3 font-mono text-[11px] text-muted-foreground">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            engineStatus === "running" ? "bg-affected animate-pulse" :
            engineStatus === "loading" ? "bg-primary animate-pulse" :
            engineStatus === "error" || engineStatus === "offline" ? "bg-destructive" :
            "bg-active"
          )}
        />
        engine · {engineStatus}
      </div>
    </aside>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1 block text-[11px] text-muted-foreground">{children}</label>
);
export const selectCls = "h-8 w-full rounded-sm border border-input bg-background px-2 text-[13px] outline-none transition-colors hover:border-foreground/25 focus:border-primary";

const PanelHead = ({ title, meta }: { title: string; meta?: string | undefined }) => (
  <div className="flex h-10 items-center justify-between border-b border-border px-4">
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
    {meta && <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>}
  </div>
);

export interface ControlsProps {
  network: Network;
  startNode?: string;
  onStartNodeChange?: (id: string) => void;
  algorithm?: "BFS" | "DFS";
  onAlgorithmChange?: (algo: "BFS" | "DFS") => void;
  cascadeModel?: "Threshold" | "Failure" | "Simple";
  onCascadeModelChange?: (model: "Threshold" | "Failure" | "Simple") => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  status?: EngineStatus;
  currentStep?: number;
  totalSteps?: number;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export function Controls({
  network,
  startNode,
  onStartNodeChange,
  algorithm = "BFS",
  onAlgorithmChange,
  cascadeModel = "Threshold",
  onCascadeModelChange,
  speed: controlledSpeed,
  onSpeedChange,
  status = "idle",
  currentStep = 0,
  totalSteps = 0,
  onStart,
  onPause,
  onReset,
}: ControlsProps) {
  const [internalSpeed, setInternalSpeed] = useState(50);
  const speed = controlledSpeed !== undefined ? controlledSpeed : internalSpeed;
  const setSpeed = onSpeedChange || setInternalSpeed;

  const currentStartNode = startNode || network.nodes[0]?.id || "";

  return (
    <section className="panel">
      <PanelHead
        title="Simulation"
        meta={status === "running" || status === "paused" || currentStep > 0 ? `Step ${currentStep}/${totalSteps}` : undefined}
      />
      <div className="space-y-3 p-4">
        <div>
          <Label>Start node</Label>
          <select
            value={currentStartNode}
            onChange={(e) => onStartNodeChange?.(e.target.value)}
            disabled={status === "running"}
            className={cn(selectCls, status === "running" && "opacity-75")}
          >
            {network.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id} — {n.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Algorithm</Label>
            <select
              value={algorithm}
              onChange={(e) => onAlgorithmChange?.(e.target.value as "BFS" | "DFS")}
              disabled={status === "running"}
              className={cn(selectCls, status === "running" && "opacity-75")}
            >
              <option value="BFS">BFS</option>
              <option value="DFS">DFS</option>
            </select>
          </div>
          <div>
            <Label>Cascade model</Label>
            <select
              value={cascadeModel}
              onChange={(e) => onCascadeModelChange?.(e.target.value as "Threshold" | "Failure" | "Simple")}
              disabled={status === "running"}
              className={cn(selectCls, status === "running" && "opacity-75")}
            >
              <option value="Threshold">Threshold</option>
              <option value="Failure">Failure</option>
              <option value="Simple">Simple</option>
            </select>
          </div>
        </div>
        <div>
          <div className="flex justify-between">
            <Label>Speed</Label>
            <span className="font-mono text-[11px] text-foreground">{speed}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="h-1 w-full accent-primary"
          />
        </div>
        <div className="flex gap-1.5 pt-1">
          <button
            type="button"
            onClick={onStart}
            disabled={status === "loading"}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-60"
          >
            <Play className="h-3.5 w-3.5" />
            {status === "running" ? "Running" : status === "paused" ? "Resume" : status === "loading" ? "Starting..." : "Start"}
          </button>
          <button
            type="button"
            title="Pause"
            onClick={onPause}
            disabled={status !== "running"}
            className="grid h-8 w-9 place-items-center rounded-sm border border-input bg-secondary text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Reset"
            onClick={onReset}
            className="grid h-8 w-9 place-items-center rounded-sm border border-input bg-secondary text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

const dot: Record<NodeStatus, string> = { active: "bg-active", affected: "bg-affected", inactive: "bg-inactive" };

export function NodeInfo({
  network,
  id,
  analytics,
}: {
  network: Network;
  id: string | null;
  analytics?: CascadeAnalytics | null;
}) {
  const n = network.nodes.find((x) => x.id === id);
  return (
    <section className="panel flex-1">
      <PanelHead title="Node" meta={n?.id} />
      {!n ? (
        <p className="p-4 text-[13px] text-muted-foreground">Select a node</p>
      ) : (() => {
        const nb = neighborsOf(network, n.id);
        const centrality = analytics?.degree_centrality?.[n.id];
        return (
          <dl className="divide-y divide-border text-[13px]">
            <Row k="ID"><span className="font-mono">{n.id}</span></Row>
            <Row k="Label">{n.label}</Row>
            <Row k="Status"><span className="flex items-center gap-1.5 capitalize"><span className={cn("h-1.5 w-1.5 rounded-full", dot[n.status])} />{n.status}</span></Row>
            <Row k="Degree"><span className="font-mono">{nb.length}</span></Row>
            <Row k="Influence">
              <div className="flex items-center gap-2">
                <div className="h-1 w-16 bg-muted"><div className="h-full bg-primary" style={{ width: `${n.influence * 100}%` }} /></div>
                <span className="font-mono">{n.influence.toFixed(2)}</span>
              </div>
            </Row>
            {centrality !== undefined && (
              <Row k="Centrality">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, centrality * 100)}%` }} /></div>
                  <span className="font-mono">{centrality.toFixed(3)}</span>
                </div>
              </Row>
            )}
            <div className="px-4 py-2.5">
              <dt className="mb-2 text-muted-foreground">Connected</dt>
              <dd className="flex flex-wrap gap-1">{nb.map((x) => <span key={x} className="rounded-xs border border-border bg-background px-1.5 py-0.5 font-mono text-[11px]">{x}</span>)}</dd>
            </div>
          </dl>
        );
      })()}
    </section>
  );
}

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd>{children}</dd></div>
);

export function Metrics({ network, analytics }: { network: Network; analytics?: CascadeAnalytics | null }) {
  const count = (s: NodeStatus) => network.nodes.filter((n) => n.status === s).length;
  const cards: { label: string; value: string | number; dot?: string }[] = [
    { label: "Nodes", value: network.nodes.length },
    { label: "Connections", value: network.edges.length },
    { label: "Active", value: count("active"), dot: "bg-active" },
    { label: "Affected", value: count("affected"), dot: "bg-affected" },
  ];

  if (analytics) {
    cards.push(
      { label: "Cascade Size", value: analytics.total_cascade_size, dot: "bg-affected" },
      { label: "Max Depth", value: analytics.max_depth },
      { label: "Spread", value: `${Math.round(analytics.cascade_spread * 100)}%` },
      { label: "Components", value: analytics.connected_components?.count ?? 1 },
    );
  }

  return (
    <div
      className={cn(
        "panel grid divide-border",
        analytics
          ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 lg:divide-x"
          : "grid-cols-2 lg:grid-cols-4 lg:divide-x"
      )}
    >
      {cards.map((c) => (
        <div key={c.label} className="px-5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {c.dot && <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />}{c.label}
          </p>
          <p className="mt-1 font-mono text-2xl font-medium tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
