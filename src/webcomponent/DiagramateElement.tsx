import { createRoot, type Root } from "react-dom/client";
import { DiagramSvg } from "../renderer/DiagramSvg";
import { validateSpec, type DiagramSpec } from "../spec";

const STYLE = `
  :host { display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .diagramate-error {
    padding: 16px;
    background: #FCE8E4;
    border: 1px solid #F3B4A6;
    border-radius: 8px;
    color: #8C3220;
    font-size: 13px;
  }
  .diagramate-error ul { margin: 6px 0 0; padding-left: 18px; }
  svg { max-width: 100%; height: auto; display: block; }
`;

interface ParseFailure {
  __parseError: string;
}

function isParseFailure(value: unknown): value is ParseFailure {
  return typeof value === "object" && value !== null && "__parseError" in value;
}

/**
 * <diagramate-diagram> — renders a Diagramate spec as an animated SVG
 * diagram. Framework-agnostic: works on any page, no build step required by
 * the host. Ships as a single <script> bundle with React included, so the
 * consuming page needs zero dependencies of its own.
 *
 * Usage:
 *   <script src="https://unpkg.com/diagramate/dist-webcomponent/diagramate.js"></script>
 *   <diagramate-diagram spec='{"schemaVersion":1,...}'></diagramate-diagram>
 *
 * Or set the spec as a JS object instead of a JSON-string attribute:
 *   document.querySelector('diagramate-diagram').spec = { ... };
 */
export class DiagramateElement extends HTMLElement {
  static get observedAttributes() {
    return ["spec"];
  }

  private reactRoot: Root | null = null;
  private mountPoint: HTMLDivElement;
  private currentSpec: unknown = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLE;
    shadow.appendChild(style);
    this.mountPoint = document.createElement("div");
    shadow.appendChild(this.mountPoint);
  }

  connectedCallback() {
    this.reactRoot = createRoot(this.mountPoint);
    if (this.hasAttribute("spec") && this.currentSpec === null) {
      this.parseAttributeSpec();
    }
    this.renderContent();
  }

  disconnectedCallback() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }

  attributeChangedCallback(name: string) {
    if (name === "spec") {
      this.parseAttributeSpec();
      this.renderContent();
    }
  }

  /** Set the diagram spec programmatically: el.spec = { ... } */
  set spec(value: unknown) {
    this.currentSpec = value;
    this.renderContent();
  }

  get spec(): unknown {
    return this.currentSpec;
  }

  private parseAttributeSpec() {
    const raw = this.getAttribute("spec");
    if (!raw) {
      this.currentSpec = null;
      return;
    }
    try {
      this.currentSpec = JSON.parse(raw);
    } catch (error) {
      this.currentSpec = { __parseError: (error as Error).message } satisfies ParseFailure;
    }
  }

  private renderContent() {
    if (!this.reactRoot) return;

    if (isParseFailure(this.currentSpec)) {
      this.reactRoot.render(
        errorPanel([`Invalid JSON in "spec" attribute: ${this.currentSpec.__parseError}`]),
      );
      return;
    }

    if (this.currentSpec === null) {
      this.reactRoot.render(errorPanel(['Missing "spec" attribute or property.']));
      return;
    }

    const result = validateSpec(this.currentSpec);
    if (!result.ok) {
      this.reactRoot.render(errorPanel(result.errors));
      return;
    }

    this.reactRoot.render(<DiagramSvg spec={result.spec as DiagramSpec} />);
  }
}

function errorPanel(errors: string[]) {
  return (
    <div className="diagramate-error">
      <strong>Diagramate: couldn't render diagram</strong>
      <ul>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

export function registerDiagramateElement(tagName = "diagramate-diagram") {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, DiagramateElement);
  }
}
