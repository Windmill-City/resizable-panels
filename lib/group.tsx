"use client"

import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
import { adjustPanelByDelta, useResizableContext } from "./context"
import type { GroupValue, PanelValue, ResizableGroupProps } from "./types"

export const GroupContext = createContext<GroupValue | null>(null)

export function useGroupContext() {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error("useGroupContext must be used within ResizableGroup")
  }
  return context
}

export function ResizableGroup({ id: idProp, children, className = "", direction = "col" }: ResizableGroupProps) {
  const context = useResizableContext()

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  const ref = useRef<GroupValue>({
    id,
    direction,
    panels: new Map<string, PanelValue>(),
    containerEl,
    registerPanel: (panel: PanelValue) => {
      ref.panels.set(panel.id, panel)
      console.debug("[ResizableGroup] Register panel:", panel.id, "Panels:", Array.from(ref.panels.keys()))
    },
    unregisterPanel: (panelId: string) => {
      ref.panels.delete(panelId)
      console.debug("[ResizableGroup] Unregister panel:", panelId, "Panels:", Array.from(ref.panels.keys()))
    },
    setCollapse: (panelId: string, collapse: boolean): boolean => {
      const panel = ref.panels.get(panelId)
      if (!panel) {
        throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
      }
      if (!panel.collapsible || panel.isCollapsed === collapse) return false

      const panels = Array.from(ref.panels.values())
      const index = panels.indexOf(panel)

      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)

      if (collapse) {
        adjustPanelByDelta(panelsBefore, panelsAfter, -panel.size, ref)
      } else {
        adjustPanelByDelta(panelsBefore, panelsAfter, panel.prevSize, ref)
      }

      // Check if the operation succeeded
      return panel.isCollapsed === collapse
    },
    setMaximize: (panelId?: string): boolean => {
      if (panelId) {
        const panel = ref.panels.get(panelId)
        if (!panel) {
          throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
        }
        if (!panel.okMaximize || panel.isMaximized) return false

        const panels = Array.from(ref.panels.values())
        const index = panels.indexOf(panel)

        // Save current state before maximizing
        ref.prevMaximize = panels.map((p) => [p.isCollapsed, p.size])

        // Simulate dragging left handle (collapse left panels)
        if (index > 0) {
          const leftPanels = panels.slice(0, index)
          const leftTotalSize = leftPanels.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.size), 0)
          if (leftTotalSize > 0) {
            // Negative delta: panelsBefore shrinks, panelsAfter grows
            // We want left panels to shrink, so we use negative delta
            const panelsBefore = panels.slice(0, index).reverse()
            const panelsAfter = panels.slice(index)
            adjustPanelByDelta(panelsBefore, panelsAfter, -leftTotalSize, ref)
          }
        }

        // Simulate dragging right handle (collapse right panels)
        if (index < panels.length - 1) {
          const rightPanels = panels.slice(index + 1)
          const rightTotalSize = rightPanels.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.size), 0)
          if (rightTotalSize > 0) {
            // Positive delta: panelsBefore grows, panelsAfter shrinks
            // We want right panels to shrink, so we drag the handle at current panel with positive delta
            const panelsBefore = panels.slice(0, index + 1).reverse()
            const panelsAfter = panels.slice(index + 1)
            adjustPanelByDelta(panelsBefore, panelsAfter, rightTotalSize, ref)
          }
        }

        return panel.isMaximized
      } else {
        // Restore all panels to previous state
        const prevState = ref.prevMaximize
        if (!prevState) return true

        const panels = Array.from(ref.panels.values())
        panels.forEach((p, i) => {
          if (i < prevState.length) {
            const [wasCollapsed, prevSize] = prevState[i]
            p.isCollapsed = wasCollapsed
            p.size = prevSize
          }
        })

        ref.prevMaximize = undefined
        return true
      }
    },
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)
    return () => context.unregisterGroup(id)
  }, [])

  const isCol = direction === "col"

  return (
    <GroupContext.Provider value={ref}>
      <div
        ref={containerEl}
        data-resizable-group
        data-group-id={id}
        data-direction={direction}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isCol ? "row" : "column",
        }}
        className={className}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}
