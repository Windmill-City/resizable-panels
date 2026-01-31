import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/resizable-panels/",
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ["@local/resizable-panels"],
  },
})
