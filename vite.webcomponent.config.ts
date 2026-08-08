import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Separate build target from the main app: bundles React in, so the output
// is a single dependency-free <script> tag any page can embed. See
// docs/architecture.md and src/webcomponent/DiagramateElement.tsx.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-webcomponent",
    emptyOutDir: true,
    lib: {
      entry: "src/webcomponent/register.ts",
      name: "Diagramate",
      formats: ["iife", "es"],
      fileName: (format) => (format === "iife" ? "diagramate.js" : "diagramate.esm.js"),
    },
  },
});
