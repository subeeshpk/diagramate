interface SpecEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: string[];
}

/**
 * Raw JSON spec editor — the fallback path every input method (including a
 * future NL-to-spec LLM adapter) shares. No syntax highlighting for v1;
 * that's a reasonable "good first issue" once someone wants CodeMirror.
 */
export function SpecEditor({ value, onChange, errors }: SpecEditorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          padding: 14,
          border: "1px solid #D8D5C9",
          borderRadius: 8,
          resize: "none",
          background: "#FFFFFF",
          color: "#22262E",
        }}
      />
      {errors.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background: "#FCE8E4",
            border: "1px solid #F3B4A6",
            borderRadius: 8,
            color: "#8C3220",
            fontSize: 12.5,
            maxHeight: 140,
            overflowY: "auto",
          }}
        >
          <strong>Spec errors:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
