import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[DEBUG] main.tsx: Starting React app mount");

createRoot(document.getElementById("root")!).render(
  <App />
);

console.log("[DEBUG] main.tsx: React render called");
