import { useMemo, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  useNodesState, type Node, type Edge, type NodeProps, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { NetNode, Network } from "@/lib/graph-data";
import { cn } from "@/lib/utils";

type NData = { net: NetNode };

const statusStyle = {
  active: "border-active text-active",
  affected: "border-affected text-affected",
  inactive: "border-inactive text-muted-foreground",
};

function NetNodeView({ data, selected }: NodeProps<Node<NData>>) {
  const n = data.net;
  return (
    <div className="flex flex-col items-center gap-1">
      <Handle type="target" position={Position.Top} className="!opacity-0" style={{ top: 18 }} />
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border-[1.5px] bg-surface font-mono text-[10px] font-semibold transition-[transform,box-shadow] duration-150 hover:scale-105",
          statusStyle[n.status],
          selected && "outline-2 outline-offset-2 outline-primary",
        )}
      >
        {n.id}
      </div>
      <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{n.label}</span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" style={{ top: 18 }} />
    </div>
  );
}

const nodeTypes = { net: NetNodeView };

export function NetworkGraph({ network, onSelect }: { network: Network; onSelect: (id: string | null) => void }) {
  const initial = useMemo<Node<NData>[]>(
    () => network.nodes.map((n) => ({ id: n.id, type: "net", position: { x: n.x, y: n.y }, data: { net: n } })),
    [network],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initial);

  useEffect(() => {
    setNodes((prevNodes) =>
      network.nodes.map((n) => {
        const existing = prevNodes.find((pn) => pn.id === n.id);
        return {
          id: n.id,
          type: "net",
          position: existing?.position ?? { x: n.x, y: n.y },
          data: { net: n },
        };
      })
    );
  }, [network.nodes, setNodes]);

  const edges = useMemo<Edge[]>(() => {
    const affected = new Set(network.nodes.filter((n) => n.status === "affected").map((n) => n.id));
    const active = new Set(network.nodes.filter((n) => n.status === "active").map((n) => n.id));
    return network.edges.map(([s, t]) => {
      const hot =
        (affected.has(s) && affected.has(t)) ||
        (active.has(s) && affected.has(t)) ||
        (affected.has(s) && active.has(t));
      return {
        id: `${s}-${t}`, source: s, target: t, type: "straight", animated: hot,
        style: { stroke: hot ? "var(--affected)" : "var(--edge)", strokeWidth: hot ? 1.5 : 1 },
      };
    });
  }, [network]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onSelectionChange={({ nodes }) => onSelect(nodes[0]?.id ?? null)}
      onPaneClick={() => onSelect(null)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      colorMode="dark"
      style={{ background: "transparent" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--grid)" />
      <Controls showInteractive={false} position="bottom-left" />
      <MiniMap pannable zoomable maskColor="oklch(0 0 0 / 55%)" nodeColor={() => "var(--inactive)"} />
    </ReactFlow>
  );
}
