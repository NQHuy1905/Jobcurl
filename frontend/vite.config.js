import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ports come from jobcurl.sh (FRONTEND_PORT / BACKEND_PORT); defaults match it.
const frontendPort = Number(process.env.FRONTEND_PORT || 3010);
const backendPort = Number(process.env.BACKEND_PORT || 8010);
const proxy = { "/api": `http://127.0.0.1:${backendPort}` };

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: frontendPort, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: frontendPort, strictPort: true, proxy },
});
