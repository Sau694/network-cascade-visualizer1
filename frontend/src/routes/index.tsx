import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { NetworkGraph } from "@/components/sim/NetworkGraph";
import { Sidebar, Controls, NodeInfo, Metrics, selectCls, type SidebarTab } from "@/components/sim/Panels";
import { AnalyticsView } from "@/components/sim/AnalyticsView";
import { SettingsView } from "@/components/sim/SettingsView";
import { PRESETS, type PresetId } from "@/lib/graph-data";
import { useCascadeSimulation } from "@/hooks/useCascadeSimulation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simulator — Network Cascade Visualizer" },
      { name: "description", content: "Visualize and simulate cascades across an interactive network graph." },
      { property: "og:title", content: "Simulator — Network Cascade Visualizer" },
      { property: "og:description", content: "Visualize and simulate cascades across an interactive network graph." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const sim = useCascadeSimulation("small");
  const [activeTab, setActiveTab] = useState<SidebarTab>("simulator");

  useEffect(() => {
    if (sim.errorMessage) {
      toast.error(sim.errorMessage);
    }
  }, [sim.errorMessage]);

  const titles: Record<SidebarTab, { title: string; desc: string }> = {
    simulator: {
      title: "Simulator",
      desc: "Drag, zoom and select nodes to inspect the network",
    },
    analytics: {
      title: "Network Analytics",
      desc: "Centrality distribution, connected components, and cascade propagation metrics",
    },
    settings: {
      title: "Settings",
      desc: "Configure API backend endpoint, simulation parameters, and defaults",
    },
  };

  const { title, desc } = titles[activeTab];

  return (
    <div className="flex h-screen">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        engineStatus={sim.status}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-5">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
            <span className="truncate text-[12px] text-muted-foreground">{desc}</span>
          </div>
          {activeTab === "simulator" ? (
            <div className="flex shrink-0 gap-4 font-mono text-[11px] text-muted-foreground">
              {[["bg-active", "active"], ["bg-affected", "affected"], ["bg-inactive", "inactive"]].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", c)} />
                  {l}
                </span>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[11px] text-muted-foreground">
              {sim.preset.toUpperCase()} PRESET · {sim.network.nodes.length} NODES
            </div>
          )}
        </header>

        {activeTab === "simulator" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="flex min-h-0 flex-1 gap-3">
              <section className="graph-surface relative min-w-0 flex-1 overflow-hidden">
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-sm border border-border bg-surface px-2 py-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <label htmlFor="preset" className="text-[11px] text-muted-foreground">Preset</label>
                  <select
                    id="preset"
                    value={sim.preset}
                    onChange={(e) => sim.loadPreset(e.target.value as PresetId)}
                    disabled={sim.status === "running"}
                    className={cn(selectCls, "h-7 w-40", sim.status === "running" && "opacity-75")}
                  >
                    {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="absolute right-3 top-3 z-10 font-mono text-[11px] text-muted-foreground">
                  {sim.network.nodes.length} nodes · {sim.network.edges.length} edges
                </div>
                <NetworkGraph
                  network={sim.network}
                  onSelect={(id) => {
                    sim.setSelectedId(id);
                    if (id && sim.status === "idle") {
                      sim.setStartNode(id);
                    }
                  }}
                />
              </section>
              <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto">
                <Controls
                  network={sim.network}
                  startNode={sim.startNode}
                  onStartNodeChange={sim.setStartNode}
                  algorithm={sim.algorithm}
                  onAlgorithmChange={sim.setAlgorithm}
                  cascadeModel={sim.cascadeModel}
                  onCascadeModelChange={sim.setCascadeModel}
                  speed={sim.speed}
                  onSpeedChange={sim.setSpeed}
                  status={sim.status}
                  currentStep={sim.currentStepIndex}
                  totalSteps={sim.totalSteps}
                  onStart={sim.startSimulation}
                  onPause={sim.pauseSimulation}
                  onReset={sim.resetSimulation}
                />
                <NodeInfo
                  network={sim.network}
                  id={sim.selectedId}
                  analytics={sim.analytics}
                />
              </div>
            </div>
            <Metrics network={sim.network} analytics={sim.analytics} />
          </div>
        )}

        {activeTab === "analytics" && (
          <AnalyticsView
            network={sim.network}
            analytics={sim.analytics}
            onSwitchToSimulator={() => setActiveTab("simulator")}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            algorithm={sim.algorithm}
            onAlgorithmChange={sim.setAlgorithm}
            cascadeModel={sim.cascadeModel}
            onCascadeModelChange={sim.setCascadeModel}
            speed={sim.speed}
            onSpeedChange={sim.setSpeed}
            onResetEngine={sim.resetSimulation}
          />
        )}
      </main>
    </div>
  );
}
