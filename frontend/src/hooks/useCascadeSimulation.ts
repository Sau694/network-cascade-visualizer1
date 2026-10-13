import { useState, useEffect, useRef, useCallback } from "react";
import {
  type Network,
  type PresetId,
  type NodeStatus,
  getPreset,
} from "@/lib/graph-data";
import {
  runCascadeSimulation,
  formatNetworkForBackend,
  checkBackendHealth,
  type SimulationStep,
  type CascadeAnalytics,
} from "@/services/api";

export type EngineStatus = "idle" | "loading" | "running" | "paused" | "completed" | "error" | "offline";

export function useCascadeSimulation(initialPreset: PresetId = "small") {
  const [preset, setPreset] = useState<PresetId>(initialPreset);
  const [network, setNetwork] = useState<Network>(() => getPreset(initialPreset));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [startNode, setStartNode] = useState<string>(() => {
    const initialNet = getPreset(initialPreset);
    return initialNet.nodes[0]?.id ?? "N1";
  });

  const [algorithm, setAlgorithm] = useState<"BFS" | "DFS">("BFS");
  const [cascadeModel, setCascadeModel] = useState<"Threshold" | "Failure" | "Simple">("Threshold");
  const [speed, setSpeed] = useState<number>(50);

  const [status, setStatus] = useState<EngineStatus>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [analytics, setAnalytics] = useState<CascadeAnalytics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References for animation timer and latest states
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef<SimulationStep[]>([]);
  stepsRef.current = steps;

  const currentStepRef = useRef<number>(0);
  currentStepRef.current = currentStepIndex;

  const speedRef = useRef<number>(speed);
  speedRef.current = speed;

  const modelRef = useRef(cascadeModel);
  modelRef.current = cascadeModel;

  const startNodeRef = useRef(startNode);
  startNodeRef.current = startNode;

  // Check backend health periodically or on mount
  useEffect(() => {
    let mounted = true;
    checkBackendHealth()
      .then(() => {
        if (mounted && status === "idle") {
          // Healthy and ready
        }
      })
      .catch(() => {
        if (mounted && status === "idle") {
          // Backend is currently offline/unreachable
          // We don't block the UI, but update engine status if idle
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const applyStepToNetwork = useCallback(
    (step: SimulationStep, model: "Threshold" | "Failure" | "Simple", seed: string) => {
      setNetwork((prevNet) => ({
        ...prevNet,
        nodes: prevNet.nodes.map((n) => {
          let nodeStatus: NodeStatus = "inactive";
          if (model === "Failure") {
            if (step.failed_nodes.includes(n.id)) {
              nodeStatus = "affected";
            } else if (step.active_nodes.includes(n.id)) {
              nodeStatus = "active";
            }
          } else {
            // Threshold or Simple cascade
            if (n.id === seed) {
              nodeStatus = "active";
            } else if (step.active_nodes.includes(n.id)) {
              nodeStatus = "affected";
            }
          }
          return { ...n, status: nodeStatus };
        }),
      }));
    },
    [],
  );

  // Step ticker function
  const scheduleNextStep = useCallback(
    (nextIndex: number) => {
      clearTimer();
      const currentSteps = stepsRef.current;
      if (nextIndex >= currentSteps.length) {
        setStatus("completed");
        return;
      }

      // Calculate step delay based on speed (1 -> 1500ms, 50 -> 750ms, 100 -> 150ms)
      const currentSpeed = speedRef.current;
      const delay = Math.max(120, Math.round(1500 - (currentSpeed / 100) * 1350));

      timerRef.current = setTimeout(() => {
        const step = currentSteps[nextIndex];
        if (step) {
          setCurrentStepIndex(nextIndex);
          applyStepToNetwork(step, modelRef.current, startNodeRef.current);
          scheduleNextStep(nextIndex + 1);
        } else {
          setStatus("completed");
        }
      }, delay);
    },
    [clearTimer, applyStepToNetwork],
  );

  const loadPreset = useCallback(
    (id: PresetId) => {
      clearTimer();
      setPreset(id);
      const newNet = getPreset(id);
      // Reset node statuses cleanly to inactive
      const cleanNet: Network = {
        ...newNet,
        nodes: newNet.nodes.map((n) => ({ ...n, status: "inactive" })),
      };
      setNetwork(cleanNet);
      const newFirstNode = cleanNet.nodes[0]?.id ?? "N1";
      setStartNode(newFirstNode);
      setSelectedId(null);
      setStatus("idle");
      setSteps([]);
      setCurrentStepIndex(0);
      setAnalytics(null);
      setErrorMessage(null);
    },
    [clearTimer],
  );

  const startSimulation = useCallback(async () => {
    // If paused with existing steps, resume playback
    if (status === "paused" && stepsRef.current.length > 0) {
      setStatus("running");
      scheduleNextStep(currentStepRef.current + 1);
      return;
    }

    // If completed or idle, run full simulation from backend
    clearTimer();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const backendModel: "threshold" | "failure" = cascadeModel === "Failure" ? "failure" : "threshold";
      const backendAlgorithm: "bfs" | "dfs" = algorithm.toLowerCase() === "dfs" ? "dfs" : "bfs";

      const payload = {
        network: formatNetworkForBackend(network, preset),
        seed_nodes: [startNode],
        model_type: backendModel,
        algorithm: backendAlgorithm,
        max_steps: 20,
      };

      const response = await runCascadeSimulation(payload);

      setSteps(response.steps);
      setAnalytics(response.analytics);
      stepsRef.current = response.steps;

      // Apply initial step 0 immediately
      const initialStep = response.steps[0];
      if (initialStep) {
        setCurrentStepIndex(0);
        applyStepToNetwork(initialStep, cascadeModel, startNode);
      }

      if (response.steps.length > 1) {
        setStatus("running");
        scheduleNextStep(1);
      } else {
        setStatus("completed");
      }
    } catch (err: any) {
      console.error("Simulation error:", err);
      const message = err?.message || "Failed to run simulation. Ensure backend is running.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [
    status,
    clearTimer,
    scheduleNextStep,
    cascadeModel,
    algorithm,
    network,
    preset,
    startNode,
    applyStepToNetwork,
  ]);

  const pauseSimulation = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resetSimulation = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setCurrentStepIndex(0);
    // Reset nodes to inactive, leaving start node ready
    setNetwork((prevNet) => ({
      ...prevNet,
      nodes: prevNet.nodes.map((n) => ({
        ...n,
        status: n.id === startNode ? "active" : "inactive",
      })),
    }));
  }, [clearTimer, startNode]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    preset,
    loadPreset,
    network,
    setNetwork,
    selectedId,
    setSelectedId,
    startNode,
    setStartNode,
    algorithm,
    setAlgorithm,
    cascadeModel,
    setCascadeModel,
    speed,
    setSpeed,
    status,
    currentStepIndex,
    totalSteps: steps.length > 0 ? steps.length - 1 : 0,
    steps,
    analytics,
    errorMessage,
    startSimulation,
    pauseSimulation,
    resetSimulation,
  };
}
