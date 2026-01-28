"use client"

import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
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

  const ref = useRef<GroupValue>({
    id,
    orientation,
    panels: new Map<string, PanelValue>(),
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
        panel.openSize = panel.size
        panel.size = 0
        panel.isCollapsed = true
      } else {
        panel.size = panel.openSize
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
    isDragging: false,
    dragIndex: -1,
    maximizedPanel: undefined,
  }).current

  useLayoutEffect(() => {
    context.registerGroup(ref)
    return () => context.unregisterGroup(id)
  })

  return (
    <GroupContext.Provider value={ref}>
      <div
        data-resizable-group
        data-group-id={id}
        data-orientation={orientation}
        style={{
          overflow: "hidden",
        }}
        className={className}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}
