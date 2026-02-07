import { ClickScrollPlugin, OverlayScrollbars } from "overlayscrollbars"
import "overlayscrollbars/overlayscrollbars.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app"
import "./index.css"

OverlayScrollbars.plugin(ClickScrollPlugin)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
