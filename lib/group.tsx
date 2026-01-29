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
  direction = "col",
}: ResizableGroupProps) {
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
    return () => context.unregisterGroup(id)
  })

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
