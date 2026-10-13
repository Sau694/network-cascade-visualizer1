import { useState } from "react";
import { Server, Sliders, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getBaseApiUrl, setCustomApiUrl, checkBackendHealth } from "@/services/api";
import { selectCls } from "@/components/sim/Panels";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  algorithm: "BFS" | "DFS";
  onAlgorithmChange: (algo: "BFS" | "DFS") => void;
  cascadeModel: "Threshold" | "Failure" | "Simple";
  onCascadeModelChange: (model: "Threshold" | "Failure" | "Simple") => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onResetEngine: () => void;
}

export function SettingsView({
  algorithm,
  onAlgorithmChange,
  cascadeModel,
  onCascadeModelChange,
  speed,
  onSpeedChange,
  onResetEngine,
}: SettingsViewProps) {
  const [apiUrl, setApiUrl] = useState(() => getBaseApiUrl());
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [healthMessage, setHealthMessage] = useState<string>("");

  const handleTestConnection = async () => {
    setHealthStatus("testing");
    setHealthMessage("Testing connection to backend...");
    try {
      // Temporarily set custom API URL so health check tests the entered URL
      setCustomApiUrl(apiUrl);
      const res = await checkBackendHealth();
      setHealthStatus("success");
      setHealthMessage(res.message || "Connected successfully! Backend is healthy.");
      toast.success("Backend connection verified!");
    } catch (err: any) {
      setHealthStatus("error");
      setHealthMessage(err.message || "Unable to connect to backend server.");
      toast.error("Backend health check failed");
    }
  };

  const handleSaveApiUrl = () => {
    setCustomApiUrl(apiUrl);
    toast.success("API configuration saved!");
  };

  const handleResetApiUrl = () => {
    const defaultUrl = "http://127.0.0.1:8000/api";
    setApiUrl(defaultUrl);
    setCustomApiUrl(null);
    setHealthStatus("idle");
    setHealthMessage("");
    toast.info("Reset API URL to default.");
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:max-w-4xl">
      {/* Backend API Configuration */}
      <section className="panel overflow-hidden">
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            Backend API Configuration
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">FastAPI Engine</span>
        </div>
        <div className="space-y-4 p-4 text-[13px]">
          <div>
            <label className="mb-1.5 block font-medium text-foreground">API Base URL</label>
            <p className="mb-2 text-[12px] text-muted-foreground">
              Endpoint where the FastAPI cascade engine is running (must point to <code className="font-mono text-foreground">/api</code>).
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setHealthStatus("idle");
                }}
                className={cn(selectCls, "h-9 flex-1 font-mono text-[12px]")}
                placeholder="http://127.0.0.1:8000/api"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={healthStatus === "testing"}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-input bg-secondary px-3 font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {healthStatus === "testing" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="h-9 rounded-sm bg-primary px-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  className="h-9 rounded-sm border border-border px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Health Status Result */}
          {healthStatus !== "idle" && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-sm border p-3 text-[12px]",
                healthStatus === "success" && "border-active/40 bg-active/10 text-active",
                healthStatus === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
                healthStatus === "testing" && "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              {healthStatus === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {healthStatus === "error" && <XCircle className="h-4 w-4 shrink-0" />}
              {healthStatus === "testing" && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
              <span className="font-mono">{healthMessage}</span>
            </div>
          )}
        </div>
      </section>

      {/* Simulation Defaults */}
      <section className="panel overflow-hidden">
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Sliders className="h-3.5 w-3.5" />
            Simulation Defaults & Execution
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">Parameters</span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 text-[13px]">
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Default Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value as "BFS" | "DFS")}
              className={selectCls}
            >
              <option value="BFS">BFS (Breadth-First Search)</option>
              <option value="DFS">DFS (Depth-First Search)</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              BFS evaluates neighbors layer by layer; DFS expands deepest unvisited branches first.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Default Cascade Model</label>
            <select
              value={cascadeModel}
              onChange={(e) => onCascadeModelChange(e.target.value as "Threshold" | "Failure" | "Simple")}
              className={selectCls}
            >
              <option value="Threshold">Threshold (Neighbor Fraction)</option>
              <option value="Failure">Failure (Load & Capacity Overload)</option>
              <option value="Simple">Simple Cascade</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Threshold triggers when active neighbor share exceeds capacity; Failure cascades redistribution load.
            </p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between">
              <label className="mb-1 block text-[11px] text-muted-foreground">Default Playback Speed</label>
              <span className="font-mono text-[11px] text-foreground">{speed}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={(e) => onSpeedChange(+e.target.value)}
              className="h-1 w-full accent-primary"
            />
          </div>
        </div>
      </section>

      {/* Engine Reset & Actions */}
      <section className="panel overflow-hidden">
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Engine Reset & Diagnostics
          </h2>
        </div>
        <div className="flex items-center justify-between p-4 text-[13px]">
          <div>
            <p className="font-medium text-foreground">Reset Visualizer State</p>
            <p className="text-[12px] text-muted-foreground">
              Clears step history, halts any active simulation loops, and restores node states.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onResetEngine();
              toast.info("Simulation engine state has been reset.");
            }}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-input bg-secondary px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset State
          </button>
        </div>
      </section>
    </div>
  );
}
