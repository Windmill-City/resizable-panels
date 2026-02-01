"use client"

import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
import { adjustPanelByDelta, useResizableContext } from "./context"
import type { GroupValue, HandleValue, PanelValue, ResizableGroupProps } from "./types"

/**
 * Restore multiple panels state
 * @param panels - Panels array to restore
 * @param prevState - Previous state array [isCollapsed, size][]
 */
function restorePanelsState(panels: PanelValue[], prevState: [boolean, number][]): void {
  panels.forEach((p, i) => {
    if (i < prevState.length) {
      const [wasCollapsed, prevSize] = prevState[i]
      p.isCollapsed = wasCollapsed
      p.size = wasCollapsed ? 0 : Math.max(p.minSize, Math.min(prevSize, p.maxSize))
    }
  })
}

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
  className = undefined,
  direction = "col",
}: ResizableGroupProps) {
  const context = useResizableContext()

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  const ref = useRef<GroupValue>({
    id,
    direction,
    panels: new Map<string, PanelValue>(),
    handles: [],
    containerEl,
    isDragging: false,
    registerPanel: (panel: PanelValue) => {
      ref.panels.set(panel.id, panel)
      console.debug("[ResizableGroup] Register panel:", panel.id, "Panels:", Array.from(ref.panels.keys()))
    },
    unregisterPanel: (panelId: string) => {
      ref.panels.delete(panelId)
      console.debug("[ResizableGroup] Unregister panel:", panelId, "Panels:", Array.from(ref.panels.keys()))
    },
    registerHandle: (handle: HandleValue) => {
      ref.handles = [...ref.handles, handle]
      console.debug("[ResizableGroup] Register handle:", handle.id, "index:", handle.index)
    },
    unregisterHandle: (handleId: string) => {
      ref.handles = ref.handles.filter((h) => h.id != handleId)
      console.debug("[ResizableGroup] Unregister handle:", handleId)
    },
    setCollapse: (panelId: string, collapse: boolean): boolean => {
      console.assert(!context.isDragging, "Try to setCollapse while Dragging:", {
        context,
        group: ref,
        panelId,
        collapse,
      })
      if (context.isDragging) return false

      const panel = ref.panels.get(panelId)
      if (!panel) {
        throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
      }
      if (!panel.collapsible || panel.isCollapsed === collapse) return false

      const panels = Array.from(ref.panels.values())
      const index = panels.indexOf(panel)

      // Save current state before operation
      const prevState = panels.map((p) => [p.isCollapsed, p.size] as [boolean, number])

      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)

      if (collapse) {
        adjustPanelByDelta(panelsBefore, panelsAfter, -panel.size, ref)
      } else {
        adjustPanelByDelta(panelsBefore, panelsAfter, panel.prevSize, ref)
      }

      // Check if the operation succeeded, rollback if failed
      if (panel.isCollapsed !== collapse) {
        restorePanelsState(panels, prevState)
        return false
      }

      return true
    },
    setMaximize: (panelId?: string): boolean => {
      console.assert(!context.isDragging, "Try to setMaximize while Dragging:", { context, group: ref, panelId })
      if (context.isDragging) return false

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

        // If maximize failed, restore to previous state
        if (!panel.isMaximized) {
          if (ref.prevMaximize) {
            restorePanelsState(panels, ref.prevMaximize)
            ref.prevMaximize = undefined
          }
          return false
        }

        return true
      } else {
        // Restore all panels to previous state
        const prevState = ref.prevMaximize
        if (prevState) {
          const panels = Array.from(ref.panels.values())
          restorePanelsState(panels, prevState)
          ref.prevMaximize = undefined
        }
        return true
      }
    },
    setDefaultSize: (panelId: string): boolean => {
      console.assert(!context.isDragging, "[ResizableGroup] Try to setDefaultSize while Dragging:", {
        context,
        group: ref,
        panelId,
      })
      if (context.isDragging) return false

      const panel = ref.panels.get(panelId)
      if (!panel) {
        throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
      }

      const panels = Array.from(ref.panels.values())
      const index = panels.indexOf(panel)

      // Calculate the delta needed to reach defaultSize
      const delta = panel.defaultSize - panel.size

      if (delta === 0) return true

      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)

      // Adjust panels by delta
      adjustPanelByDelta(panelsBefore, panelsAfter, delta, ref)

      return panel.size == panel.defaultSize
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
        data-resizable-group={id}
        data-direction={direction}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isCol ? "row" : "column",
          overflow: "hidden",
        }}
        className={className}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}
