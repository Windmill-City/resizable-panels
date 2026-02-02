import { ContextValue, useResizableContext } from "@local/resizable-panels"
import { PanelBottom, PanelLeft, PanelRight, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { toggleCollapse } from "../lib/utils"

interface MenuBarProps {
  children?: React.ReactNode
  leftVisible?: boolean
  rightVisible?: boolean
  bottomVisible?: boolean
}

const MenuBar = ({ children }: MenuBarProps) => {
  const context = useResizableContext()

  // Track panel visibility states
  const [leftVisible, setLeftVisible] = useState(false)
  const [rightVisible, setRightVisible] = useState(false)
  const [bottomVisible, setBottomVisible] = useState(false)

  // Subscribe to layout changes
  useEffect(() => {
    const handleLayoutChanged = (ctx: ContextValue) => {
      const groups = Array.from(ctx.groups.values())

      const left = groups[1].panels.get("left")!
      const right = groups[1].panels.get("right")!
      const bottom = groups[0].panels.get("bottom")!

      setLeftVisible(!left.isCollapsed)
      setRightVisible(!right.isCollapsed)
      setBottomVisible(!bottom.isCollapsed)
    }

    return context.subscribe(handleLayoutChanged)
  }, [])

  const togglePanel = (panelId: string) => {
    const groups = Array.from(context.groups.values())
    switch (panelId) {
      case "left":
        {
          if (groups[1]!.prevMaximize) {
            groups[1]!.restorePanels()
            return
          }
          toggleCollapse(panelId, groups[1]!)
        }
        break
      case "right":
        {
          if (groups[1]!.prevMaximize) {
            groups[1]!.restorePanels()
            return
          }
          toggleCollapse(panelId, groups[1]!)
        }
        break
      case "bottom":
        {
          if (groups[1]!.prevMaximize) {
            groups[1]!.restorePanels()
            return
          }
          if (groups[0]!.prevMaximize) {
            groups[0]!.restorePanels()
            return
          }
          toggleCollapse(panelId, groups[0]!)
        }
        break
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
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => {
            localStorage.removeItem("resizable-panels-layout")
            window.location.reload()
          }}
          className="p-1.5 rounded transition-colors hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          title="Reset layout"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MenuBar
