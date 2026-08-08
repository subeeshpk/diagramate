import { useMemo, useRef, useState } from "react";
// `?raw` loads the file's text as-is instead of parsing it — see src/vite-env.d.ts.
import exampleSpecYaml from "../../examples/example-spec.yaml?raw";
import { DescribeSystem } from "../editor/DescribeSystem";
import { SpecEditor } from "../editor/SpecEditor";
import { exportMermaid, exportStandaloneHtml, exportStaticPng, exportStaticSvg } from "../export";
import { DiagramSvg } from "../renderer/DiagramSvg";
import { parseSpecText, validateSpec } from "../spec";
import { GraphSvg, exportMermaidFlowchart, validateSystemDesignSpec } from "../systemDesign";

const DEFAULT_SPEC_TEXT = exampleSpecYaml;

type Mode = "edit" | "describe";

/**
 * A parsed document is either a hub-and-spoke DiagramSpec ({root,
 * components}) or a peer-to-peer SystemDesignSpec ({nodes, edges}) — the
 * editor auto-detects which by checking for a "nodes" key, so there's one
 * input box for both spec shapes rather than a format picker. See
 * docs/spec-schema.md for both schemas.
 */
function detectAndValidate(specText: string) {
  const parsed = parseSpecText(specText);
  if (!parsed.ok) {
    return {
      diagramSpec: null,
      systemDesignSpec: null,
      errors: [`Couldn't parse spec (JSON or YAML): ${parsed.error}`],
    };
  }

  const value = parsed.value;
  const looksLikeGraph =
    typeof value === "object" && value !== null && "nodes" in (value as Record<string, unknown>);

  if (looksLikeGraph) {
    const result = validateSystemDesignSpec(value);
    return result.ok
      ? { diagramSpec: null, systemDesignSpec: result.spec, errors: [] }
      : { diagramSpec: null, systemDesignSpec: null, errors: result.errors };
  }

  const result = validateSpec(value);
  return result.ok
    ? { diagramSpec: result.spec, systemDesignSpec: null, errors: [] }
    : { diagramSpec: null, systemDesignSpec: null, errors: result.errors };
}

export function App() {
  const [specText, setSpecText] = useState(DEFAULT_SPEC_TEXT);
  const [mode, setMode] = useState<Mode>("edit");
  const svgRef = useRef<SVGSVGElement>(null);

  const { diagramSpec, systemDesignSpec, errors } = useMemo(
    () => detectAndValidate(specText),
    [specText],
  );

  const activeSpec = diagramSpec ?? systemDesignSpec;
  const canExport = activeSpec !== null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        height: "100vh",
        background: "#F0EFE9",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", padding: 20, gap: 12, minHeight: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#1B2A5B" }}>Diagramate</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B6656" }}>
            {mode === "edit"
              ? "Edit the spec below — JSON or YAML, single-system (root/components) or multi-service (nodes/edges) both work. The preview updates live."
              : "Describe your system in plain language and let a model draft the spec."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <ModeTabButton label="Write spec" active={mode === "edit"} onClick={() => setMode("edit")} />
          <ModeTabButton
            label="Describe system"
            active={mode === "describe"}
            onClick={() => setMode("describe")}
          />
        </div>

        {mode === "edit" ? (
          <SpecEditor value={specText} onChange={setSpecText} errors={errors} />
        ) : (
          <DescribeSystem
            onSpecGenerated={(generatedText) => {
              setSpecText(generatedText);
              setMode("edit");
            }}
          />
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ExportButton
            label="Export HTML"
            disabled={!canExport}
            onClick={() => {
              if (svgRef.current && activeSpec) exportStandaloneHtml(svgRef.current, activeSpec);
            }}
          />
          <ExportButton
            label="Export SVG"
            disabled={!canExport}
            onClick={() => {
              if (svgRef.current && activeSpec) exportStaticSvg(svgRef.current, activeSpec);
            }}
          />
          <ExportButton
            label="Export PNG"
            disabled={!canExport}
            onClick={() => {
              if (svgRef.current && activeSpec) void exportStaticPng(svgRef.current, activeSpec);
            }}
          />
          <ExportButton
            label="Export Mermaid"
            disabled={!canExport}
            onClick={() => {
              if (diagramSpec) exportMermaid(diagramSpec);
              else if (systemDesignSpec) exportMermaidFlowchart(systemDesignSpec);
            }}
          />
        </div>
      </div>

      <div style={{ overflow: "auto", padding: 32 }}>
        {diagramSpec ? (
          <DiagramSvg ref={svgRef} spec={diagramSpec} />
        ) : systemDesignSpec ? (
          <GraphSvg ref={svgRef} spec={systemDesignSpec} />
        ) : (
          <div style={{ color: "#8C3220", fontSize: 14 }}>
            Fix the spec errors on the left to see a preview.
          </div>
        )}
      </div>
    </div>
  );
}

function ModeTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        border: `1px solid ${active ? "#1B2A5B" : "#D8D5C9"}`,
        background: active ? "#1B2A5B" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#22262E",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ExportButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        borderRadius: 6,
        border: "1px solid #1B2A5B",
        background: disabled ? "#D8D5C9" : "#1B2A5B",
        color: disabled ? "#8A8577" : "#FFFFFF",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
