import { useMemo, useRef, useState } from "react";
// `?raw` loads the file's text as-is instead of parsing it — see src/vite-env.d.ts.
import exampleSpecYaml from "../../examples/example-spec.yaml?raw";
import { DescribeSystem } from "../editor/DescribeSystem";
import { SpecEditor } from "../editor/SpecEditor";
import { exportMermaid, exportStandaloneHtml, exportStaticPng, exportStaticSvg } from "../export";
import { DiagramSvg } from "../renderer/DiagramSvg";
import { parseSpecText, validateSpec } from "../spec";

const DEFAULT_SPEC_TEXT = exampleSpecYaml;

type Mode = "edit" | "describe";

export function App() {
  const [specText, setSpecText] = useState(DEFAULT_SPEC_TEXT);
  const [mode, setMode] = useState<Mode>("edit");
  const svgRef = useRef<SVGSVGElement>(null);

  const { spec, errors } = useMemo(() => {
    const parsed = parseSpecText(specText);
    if (!parsed.ok) {
      return { spec: null, errors: [`Couldn't parse spec (JSON or YAML): ${parsed.error}`] };
    }
    const result = validateSpec(parsed.value);
    return result.ok
      ? { spec: result.spec, errors: [] }
      : { spec: null, errors: result.errors };
  }, [specText]);

  const canExport = spec !== null;

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
              ? "Edit the spec below — JSON or YAML both work. The preview updates live."
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
              if (svgRef.current && spec) exportStandaloneHtml(svgRef.current, spec);
            }}
          />
          <ExportButton
            label="Export SVG"
            disabled={!canExport}
            onClick={() => {
              if (svgRef.current && spec) exportStaticSvg(svgRef.current, spec);
            }}
          />
          <ExportButton
            label="Export PNG"
            disabled={!canExport}
            onClick={() => {
              if (svgRef.current && spec) void exportStaticPng(svgRef.current, spec);
            }}
          />
          <ExportButton
            label="Export Mermaid"
            disabled={!canExport}
            onClick={() => {
              if (spec) exportMermaid(spec);
            }}
          />
        </div>
      </div>

      <div style={{ overflow: "auto", padding: 32 }}>
        {spec ? (
          <DiagramSvg ref={svgRef} spec={spec} />
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
