import { describe, expect, it } from "vitest";
import { formatNetworkForBackend, getBaseApiUrl } from "@/services/api";
import { getPreset } from "@/lib/graph-data";

describe("API Service Helpers", () => {
  it("computes base API url correctly", () => {
    const url = getBaseApiUrl();
    expect(url).toContain("http");
    expect(url.endsWith("/api")).toBe(true);
  });

  it("formats preset network for FastAPI backend correctly", () => {
    const net = getPreset("small");
    const payload = formatNetworkForBackend(net, "small");

    expect(payload.nodes.length).toBe(net.nodes.length);
    expect(payload.edges.length).toBe(net.edges.length);
    expect(payload.preset).toBe("small");

    // Each node should have id and threshold
    for (const node of payload.nodes) {
      expect(typeof node.id).toBe("string");
      expect(typeof node.threshold).toBe("number");
    }

    // Each edge should have source, target, and weight
    for (const edge of payload.edges) {
      expect(typeof edge.source).toBe("string");
      expect(typeof edge.target).toBe("string");
      expect(edge.weight).toBe(1.0);
    }
  });
});
