"use client"

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef } from "react"
import { adjustPanelByDelta, useResizableContext } from "./context"
import type { GroupProps, GroupValue, HandleValue, PanelValue } from "./types"

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
}: GroupProps) {
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
    isMaximized: false,
    registerPanel: (panel: PanelValue) => {
      ref.panels.set(panel.id, panel)
      console.debug(`[Group] Register: (${panel.id}) => [${[...ref.panels.keys()]}]`)
    },
    unregisterPanel: (panelId: string) => {
      ref.panels.delete(panelId)
      console.debug(`[Group] Unregister: (${panelId}) => [${[...ref.panels.keys()]}]`)
    },
    registerHandle: (handle: HandleValue) => {
      ref.handles = [...ref.handles, handle]
      console.debug("[Group] Register handle:", handle.id)
    },
    unregisterHandle: (handleId: string) => {
      ref.handles = ref.handles.filter((h) => h.id != handleId)
      console.debug("[Group] Unregister handle:", handleId)
    },
    dragHandle: (delta: number, index: number) => {
      console.debug("[Group] dragHandle:", { delta, index })

      const panels = [...ref.panels.values()]
      panels.forEach((p) => (p.prevDrag = [p.isCollapsed, p.size]))

      const panelsBefore = panels.slice(0, index + 1).reverse()
      const panelsAfter = panels.slice(index + 1)

      adjustPanelByDelta(panelsBefore, panelsAfter, delta, ref)
    },
    restorePanels: () => {
      if (!ref.isMaximized) return false
      console.debug("[Group] RestorePanels")

      ref.isMaximized = false

      const panels = [...ref.panels.values()]

      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i]
        panel.isCollapsed = panel.prevMaximize[0]
        panel.size = panel.prevMaximize[1]
        panel.isMaximized = false
      }

      for (const panel of panels) panel.setDirty()

      return true
    },
    maximizePanel: (targetId: string) => {
      const target = ref.panels.get(targetId)
      if (!target) {
        console.error(`[Group] maximizePanel: Panel with id "${targetId}" not found`)
        return false
      }
      if (!target.okMaximize) {
        console.error(`[Group] maximizePanel: Panel "${targetId}" cannot be maximized (okMaximize is false)`)
        return false
      }

      ref.isMaximized = true

      const panels = [...ref.panels.values()]
      panels.forEach((p) => (p.prevMaximize = [p.isCollapsed, p.size]))

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
      })

      return true
    },
    toggleMaximize: (targetId: string) => {
      if (!ref.restorePanels()) {
        ref.maximizePanel(targetId)
      }
    },
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)
    return () => context.unregisterGroup(ref.id)
  }, [])

  useLayoutEffect(() => {
    const observer = new ResizeObserver((_) => {
      for (const panel of ref.panels.values()) {
        panel.setDirty()
      }
    })
    observer.observe(ref.containerEl.current!)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    ref.direction = direction
    ref.ratio = ratio

    for (const panel of ref.panels.values()) {
      panel.setDirty()
    }
  }, [direction, ratio])

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
