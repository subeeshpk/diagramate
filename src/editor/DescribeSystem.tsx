import { useState, type CSSProperties } from "react";
import { stringify as yamlStringify } from "yaml";
import { LLM_ADAPTERS, SpecGenerationError } from "../llm";

interface DescribeSystemProps {
  /** Called with spec text (YAML) to load into the manual editor — either a
   * successful generation, or a failed model response the user can fix by hand. */
  onSpecGenerated: (specText: string) => void;
}

interface DisplayError {
  message: string;
  rawResponse?: string;
}

/**
 * Natural-language entry point: describe the system, pick a provider, get a
 * spec. Only Anthropic works today — see src/llm/openai.ts for why OpenAI
 * is listed but disabled. The API key never leaves this component's state;
 * it's not persisted anywhere and is gone on reload.
 */
export function DescribeSystem({ onSpecGenerated }: DescribeSystemProps) {
  const [providerId, setProviderId] = useState(LLM_ADAPTERS[0].id);
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);

  const adapter = LLM_ADAPTERS.find((a) => a.id === providerId) ?? LLM_ADAPTERS[0];
  const canGenerate =
    adapter.supportsBrowserCalls && description.trim() !== "" && apiKey.trim() !== "" && !isLoading;

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adapter.generateSpec(description, apiKey);
      onSpecGenerated(yamlStringify(result.spec));
    } catch (err) {
      if (err instanceof SpecGenerationError) {
        setError({
          message: `${err.message} (${err.validationErrors.join("; ")})`,
          rawResponse: err.rawResponse,
        });
      } else {
        setError({ message: (err as Error).message });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
      <div>
        <label style={labelStyle}>Provider</label>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          style={inputStyle}
        >
          {LLM_ADAPTERS.map((a) => (
            <option key={a.id} value={a.id} disabled={!a.supportsBrowserCalls}>
              {a.name}
              {!a.supportsBrowserCalls ? " — requires a backend proxy (not available yet)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>API key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Kept in memory only — cleared on reload"
          style={inputStyle}
          autoComplete="off"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your system in a couple of paragraphs: what it does, what it talks to, and how (e.g. &quot;the app calls Stripe to charge a card when an invoice is created&quot;)."
        style={{ ...inputStyle, flex: 1, resize: "none", fontFamily: "inherit" }}
      />

      <button onClick={handleGenerate} disabled={!canGenerate} style={buttonStyle(isLoading)}>
        {isLoading ? "Generating…" : "Generate spec"}
      </button>

      {error && (
        <div style={errorPanelStyle}>
          <strong>{error.message}</strong>
          {error.rawResponse && (
            <>
              <p style={{ margin: "8px 0 4px" }}>
                The model's raw response is below — load it into the editor and fix it by hand:
              </p>
              <pre style={preStyle}>{error.rawResponse}</pre>
              <button
                onClick={() => onSpecGenerated(error.rawResponse ?? "")}
                style={linkButtonStyle}
              >
                Load raw response into editor
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6B6656",
  display: "block",
  marginBottom: 4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #D8D5C9",
  borderRadius: 6,
  fontSize: 13,
  background: "#FFFFFF",
  color: "#22262E",
  boxSizing: "border-box",
};

function buttonStyle(loading: boolean): CSSProperties {
  return {
    padding: "9px 14px",
    borderRadius: 6,
    border: "1px solid #1B2A5B",
    background: loading ? "#8A8577" : "#1B2A5B",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
  };
}

const errorPanelStyle: CSSProperties = {
  padding: "10px 14px",
  background: "#FCE8E4",
  border: "1px solid #F3B4A6",
  borderRadius: 8,
  color: "#8C3220",
  fontSize: 12.5,
  maxHeight: 220,
  overflowY: "auto",
};

const preStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  background: "#FFFFFF",
  border: "1px solid #F3B4A6",
  borderRadius: 6,
  padding: 8,
  fontSize: 11.5,
  maxHeight: 120,
  overflowY: "auto",
};

const linkButtonStyle: CSSProperties = {
  marginTop: 6,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #8C3220",
  background: "#FFFFFF",
  color: "#8C3220",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
