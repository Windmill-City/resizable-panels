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
    size: 0,
    registerPanel: (panel: PanelValue) => {
      ref.panels.set(panel.id, panel)
      console.debug("[Group] Register panel:", panel.id, "Panels:", Array.from(ref.panels.keys()))
    },
    unregisterPanel: (panelId: string) => {
      ref.panels.delete(panelId)
      console.debug("[Group] Unregister panel:", panelId, "Panels:", Array.from(ref.panels.keys()))
    },
    registerHandle: (handle: HandleValue) => {
      ref.handles = [...ref.handles, handle]
      console.debug("[Group] Register handle:", handle.id, "index:", handle.index)
    },
    unregisterHandle: (handleId: string) => {
      ref.handles = ref.handles.filter((h) => h.id != handleId)
      console.debug("[Group] Unregister handle:", handleId)
    },
    dragHandle: (delta: number, index: number) => {
      console.debug("[Group] dragHandle:", { delta, index })

      const panels = Array.from(ref.panels.values())
      ref.prevDrag = panels.map((p) => [p.isCollapsed, p.size])

      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)

      adjustPanelByDelta(panelsBefore, panelsAfter, delta, ref)

      ref.prevDrag = undefined

      // Notify layout changed
      context.notify()
    },
    restorePanels: () => {
      if (!ref.prevMaximize) return

      const panels = Array.from(ref.panels.values())
      console.debug("[Group] RestorePanels:", { panels, group: ref, prevMaximize: ref.prevMaximize })

      for (let i = 0; i < panels.length; i++) {
        panels[i].isCollapsed = ref.prevMaximize[i][0]
        panels[i].size = ref.prevMaximize[i][1]
        panels[i].isMaximized = false
      }
      ref.prevMaximize = undefined

      for (const panel of panels) panel.setDirty()

      // Notify layout changed
      context.notify()
    },
    maximizePanel: (targetId: string) => {
      const target = ref.panels.get(targetId)
      if (!target) {
        console.error(`[Group] maximizePanel: Panel with id "${targetId}" not found`)
        return
      }
      if (!target.okMaximize) {
        console.error(`[Group] maximizePanel: Panel "${targetId}" cannot be maximized (okMaximize is false)`)
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

      console.debug("[Group] MaximizePanel:", {
        targetId,
        targetPanel: target,
        panels,
        group: ref,
        prevMaximize: ref.prevMaximize,
      })

      // Notify layout changed
      context.notify()
    },
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)
    return () => context.unregisterGroup(ref.id)
  }, [])

  useLayoutEffect(() => {
    const isCol = direction == "col"
    const el = ref.containerEl.current!

    // Initialize content size
    ref.size = isCol ? el.clientWidth : el.clientHeight

    // Observe size changes and update panel size (content-box)
    const observer = new ResizeObserver((_) => {
      const newSize = isCol ? el.clientWidth : el.clientHeight
      if (ref.size === newSize) return

      if (!ref.prevDrag) {
        const panels = Array.from(ref.panels.values())
        for (const panel of panels) {
          if (panel.isCollapsed) continue

          const el = panel.containerEl.current!
          const isCol = ref.direction === "col"

          const newSize = isCol ? el.clientWidth : el.clientHeight

          if (panel.size != newSize) {
            console.debug("[Group] Panel Size Changed:", { id: panel.id, oldSize: panel.size, newSize })
            panel.size = newSize
          }
        }
        context.notify()
      }
    })
    observer.observe(ref.containerEl.current!)
    return () => observer.disconnect()
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
