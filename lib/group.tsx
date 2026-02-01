"use client"

import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
import { adjustPanelByDelta, useResizableContext } from "./context"
import type { GroupValue, HandleValue, PanelValue, ResizableGroupProps } from "./types"

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
  ratio = false,
}: ResizableGroupProps) {
  const context = useResizableContext()

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  const ref = useRef<GroupValue>({
    id,
    direction,
    ratio,
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
    setCollapse: (panelId: string, collapse: boolean, isBefore = true): boolean => {
      console.assert(!context.isDragging, "Try to setCollapse while Dragging:", {
        context,
        group: ref,
        panelId,
        collapse,
        isBefore,
      })
      if (context.isDragging) return false

      const panel = ref.panels.get(panelId)
      if (!panel) {
        throw new Error(`[ResizableGroup] Panel not found: ${panelId}`)
      }
      if (!panel.collapsible || panel.isCollapsed === collapse) return false

      const panels = Array.from(ref.panels.values())
      const index = panels.indexOf(panel)

      let panelsBefore: PanelValue[]
      let panelsAfter: PanelValue[]

      if (isBefore) {
        // Before: expand/collapse from the left/top side
        panelsBefore = panels.slice(0, index + 1).reverse()
        panelsAfter = panels.slice(index + 1)
      } else {
        // After: expand/collapse from the right/bottom side
        panelsBefore = panels.slice(index).reverse()
        panelsAfter = panels.slice(0, index)
      }

      if (collapse) {
        adjustPanelByDelta(panelsBefore, panelsAfter, -panel.size, ref)
      } else {
        adjustPanelByDelta(panelsBefore, panelsAfter, panel.prevSize, ref)
      }

      requestAnimationFrame(() => {
        context.updateHoverState(context.prevPos)
      })

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

        requestAnimationFrame(() => {
          context.updateHoverState(context.prevPos)
        })

        return true
      } else {
        // Restore all panels to previous state
        const prevState = ref.prevMaximize
        if (prevState) {
          const panels = Array.from(ref.panels.values())
          panels.forEach((p, i) => {
            if (i < prevState.length) {
              const [wasCollapsed, prevSize] = prevState[i]
              p.isMaximized = false
              p.isCollapsed = wasCollapsed
              p.size = wasCollapsed ? 0 : Math.max(p.minSize, Math.min(prevSize, p.maxSize))
              p.setDirty()
            }
          })
          ref.prevMaximize = undefined
        }

        requestAnimationFrame(() => {
          context.updateHoverState(context.prevPos)
        })

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
