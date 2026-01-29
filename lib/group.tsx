"use client"

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
} from "react"
import { useResizableContext } from "./context"
import type { GroupValue, PanelValue, ResizableGroupProps } from "./types"

export const GroupContext = createContext<GroupValue | null>(null)

export function useGroupContext() {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error("useGroupContext must be used within ResizableGroup")
  }
  return context
}

export function ResizableGroup({
  id: idProp,
  children,
  className = "",
  orientation = "horizontal",
}: ResizableGroupProps) {
  const context = useResizableContext()

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  const ref = useRef<GroupValue>({
    id,
    orientation,
    panels: new Map<string, PanelValue>(),
    containerEl,
    registerPanel: (panel: PanelValue) => {
      ref.panels.set(panel.id, panel)
    },
    unregisterPanel: (panelId: string) => {
      ref.panels.delete(panelId)
    },
    setCollapse: (panelId: string, collapse: boolean) => {
      const panel = ref.panels.get(panelId)
      if (!panel) {
        throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
      }
      if (!panel.collapsible) return
      if (collapse) {
        panel.prevSize = panel.size
        panel.size = 0
        panel.isCollapsed = true
      } else {
        panel.size = panel.prevSize
        panel.isCollapsed = false
      }
    },
    setMaximize: (panelId?: string) => {
      if (panelId) {
        const panel = ref.panels.get(panelId)
        if (!panel) {
          throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
        }
        if (!panel.okMaximize) return
        if (ref.maximizedPanel) {
          ref.maximizedPanel.isMaximized = false
        }
        panel.isMaximized = true
        ref.maximizedPanel = panel
      } else {
        if (ref.maximizedPanel) {
          ref.maximizedPanel.isMaximized = false
          ref.maximizedPanel = undefined
        }
      }
    },
    maximizedPanel: undefined,
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)

    const containerEl = ref.containerEl.current!

    // Function to distribute space among panels
    const distributeSpace = () => {
      const containerSize =
        orientation === "horizontal"
          ? containerEl.clientWidth
          : containerEl.clientHeight

      const panels = Array.from(ref.panels.values())
      if (panels.length === 0) return

      // Calculate total size of panels with keepSize=true
      const keepSizeTotal = panels
        .filter((p) => p.keepSize)
        .reduce((sum, p) => sum + p.size, 0)

      // Available space for non-keepSize panels
      const availableSize = containerSize - keepSizeTotal

      // Get panels that need to be resized (keepSize=false)
      const resizablePanels = panels.filter((p) => !p.keepSize)

      if (resizablePanels.length > 0 && availableSize > 0) {
        // Calculate total size of resizable panels
        const resizableTotal = resizablePanels.reduce(
          (sum, p) => sum + p.size,
          0,
        )

        // Distribute available space proportionally
        for (const panel of resizablePanels) {
          const ratio = panel.size / resizableTotal
          panel.size = availableSize * ratio
          panel.setDirty()
        }
      }
    }

    // Distribute space on first mount
    distributeSpace()

    // Watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      distributeSpace()
    })
    resizeObserver.observe(containerEl)

    return () => {
      resizeObserver.disconnect()
      context.unregisterGroup(id)
    }
  }, [])

  const isHorizontal = orientation == "horizontal"

  return (
    <GroupContext.Provider value={ref}>
      <div
        ref={containerEl}
        data-resizable-group
        data-group-id={id}
        data-orientation={orientation}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
        }}
        className={className}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}
