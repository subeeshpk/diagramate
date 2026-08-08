import { useMemo, useRef, useState } from "react";
import exampleSpec from "../../examples/example-spec.json";
import { SpecEditor } from "../editor/SpecEditor";
import { exportMermaid, exportStandaloneHtml, exportStaticPng, exportStaticSvg } from "../export";
import { DiagramSvg } from "../renderer/DiagramSvg";
import { parseSpecText, validateSpec } from "../spec";

const DEFAULT_SPEC_TEXT = JSON.stringify(exampleSpec, null, 2);

export function App() {
  const [specText, setSpecText] = useState(DEFAULT_SPEC_TEXT);
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
      <div style={{ display: "flex", flexDirection: "column", padding: 20, gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#1B2A5B" }}>Diagramate</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B6656" }}>
            Edit the spec below — JSON or YAML both work. The preview updates live.
          </p>
        </div>
        <SpecEditor value={specText} onChange={setSpecText} errors={errors} />
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
