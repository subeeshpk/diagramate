import { registerDiagramateElement } from "./DiagramateElement";

// Auto-register on load, matching the "just drop in a <script> tag" usage
// pattern documented on the element itself.
registerDiagramateElement();

export { DiagramateElement, registerDiagramateElement } from "./DiagramateElement";
