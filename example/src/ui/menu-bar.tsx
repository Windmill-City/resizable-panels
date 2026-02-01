import { restorePanels, useResizableContext } from "@local/resizable-panels"
import { PanelBottom, PanelLeft, PanelRight } from "lucide-react"

interface MenuBarProps {
  children?: React.ReactNode
  leftVisible?: boolean
  rightVisible?: boolean
  bottomVisible?: boolean
}

const MenuBar = ({ children, leftVisible = true, rightVisible = true, bottomVisible = true }: MenuBarProps) => {
  const context = useResizableContext()

  const togglePanel = (panelId: string) => {
    for (const group of context.groups.values()) {
      const panels = Array.from(group.panels.values())
      const panelIndex = panels.findIndex((p) => p.id === panelId)

      if (panelIndex >= 0) {
        const panel = panels[panelIndex]

        // Restore if maximized
        if (group.prevMaximize) {
          restorePanels(group)
        }

        // Expand if collapsed
        if (panel.isCollapsed) {
          const isBefore = panelIndex < panels.length / 2
          const delta = isBefore ? panel.prevSize : -panel.prevSize
          group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
          return
        }

        // Collapse if expanded
        const isBefore = panelIndex < panels.length / 2
        const delta = isBefore ? -panel.size : panel.size
        group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
        return
      }
    }
  }

  return (
    <div data-menu-bar className="h-8 flex box-content relative items-center justify-between px-2 select-none">
      <div className="flex items-center gap-1">
        {/* Menu area */}
        {children}
      </div>

      {/* Panel toggle buttons - similar to VSCode */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => togglePanel("left")}
          className={`p-1.5 rounded transition-colors ${
            leftVisible
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          }`}
          title={leftVisible ? "Hide left panel" : "Show left panel"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => togglePanel("bottom")}
          className={`p-1.5 rounded transition-colors ${
            bottomVisible
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          }`}
          title={bottomVisible ? "Hide bottom panel" : "Show bottom panel"}
        >
          <PanelBottom className="w-4 h-4" />
        </button>
        <button
          onClick={() => togglePanel("right")}
          className={`p-1.5 rounded transition-colors ${
            rightVisible
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          }`}
          title={rightVisible ? "Hide right panel" : "Show right panel"}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MenuBar
