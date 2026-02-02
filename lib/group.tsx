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
    dragHandle: (delta: number, index: number) => {
      console.debug("[ResizableGroup] dragHandle:", { delta, index })
      const panels = Array.from(ref.panels.values())
      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)
      adjustPanelByDelta(panelsBefore, panelsAfter, delta, ref)
      // Trigger onLayoutChanged callback
      if (context.onLayoutChanged) {
        context.onLayoutChanged(context)
      }
    },
    restorePanels: () => {
      if (!ref.prevMaximize) return
      const panels = Array.from(ref.panels.values())
      console.debug("[Resizable] RestorePanels:", { panels, group: ref, prevMaximize: ref.prevMaximize })
      for (let i = 0; i < panels.length; i++) {
        panels[i].isCollapsed = ref.prevMaximize[i][0]
        panels[i].size = ref.prevMaximize[i][1]
        panels[i].isMaximized = false
      }
      ref.prevMaximize = undefined
      for (const panel of panels) panel.setDirty()
      // Trigger onLayoutChanged callback
      if (context.onLayoutChanged) {
        context.onLayoutChanged(context)
      }
    },
    maximizePanel: (targetId: string) => {
      const target = ref.panels.get(targetId)
      if (!target) {
        console.error(`[ResizableGroup] maximizePanel: Panel with id "${targetId}" not found`)
        return
      }
      if (!target.okMaximize) {
        console.error(`[ResizableGroup] maximizePanel: Panel "${targetId}" cannot be maximized (okMaximize is false)`)
        return
      }

      const panels = Array.from(ref.panels.values())
      ref.prevMaximize = panels.map((p) => [p.isCollapsed, p.size] as [boolean, number])

      for (const panel of panels) {
        if (panel.id !== targetId) {
          panel.isCollapsed = true
          panel.size = 0
        } else {
          panel.isMaximized = true
          panel.isCollapsed = false
        }
      }

      for (const panel of panels) panel.setDirty()

      console.debug("[Resizable] MaximizePanel:", {
        targetId,
        targetPanel: target,
        panels,
        group: ref,
        prevMaximize: ref.prevMaximize,
      })

      // Trigger onLayoutChanged callback
      if (context.onLayoutChanged) {
        context.onLayoutChanged(context)
      }
    },
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)
    return () => context.unregisterGroup(ref.id)
  }, [])

  const isCol = ref.direction === "col"

  return (
    <GroupContext.Provider value={ref}>
      <div
        ref={containerEl}
        data-resizable-group={ref.id}
        data-direction={ref.direction}
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
