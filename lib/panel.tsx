"use client"

import { createContext, useContext, useId, useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

export const PanelContext = createContext<PanelValue | null>(null)

export function usePanelContext() {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error("usePanelContext must be used within ResizablePanel")
  }
  return context
}

export function ResizablePanel({
  id: idProp,
  children,
  className = undefined,
  expand = false,
  defaultSize = 300,
  minSize = 200,
  maxSize = Infinity,
  collapsible = false,
  collapsed = false,
  okMaximize = false,
}: ResizablePanelProps) {
  const group = useGroupContext()
  const [, setDirty] = useReducer(() => ({}), {})

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  if (!group.ratio) {
    console.assert(defaultSize >= minSize, "[Panel] defaultSize < minSize:", {
      id,
      defaultSize,
      minSize,
      maxSize,
    })
    console.assert(defaultSize <= maxSize, "[Panel] defaultSize > maxSize:", {
      id,
      defaultSize,
      minSize,
      maxSize,
    })
  }
  console.assert(minSize <= maxSize, "[Panel] minSize > maxSize:", {
    id,
    minSize,
    maxSize,
  })
  console.assert(minSize >= 0, "[Panel] minSize < 0:", { id, minSize, maxSize })

  const ref = useRef<PanelValue>({
    id,
    size: collapsed ? 0 : defaultSize,
    minSize,
    maxSize,
    expand,
    openSize: defaultSize,
    collapsible,
    isCollapsed: collapsed,
    okMaximize,
    isMaximized: false,
    containerEl,
    setDirty,
  }).current

  const isCol = group.direction === "col"

  useLayoutEffect(() => {
    group.registerPanel(ref)
    return () => group.unregisterPanel(id)
  }, [])

  useLayoutEffect(() => {
    const el = containerEl.current!

    // Initialize size from actual DOM dimensions (content-box)
    ref.size = isCol ? el.clientWidth : el.clientHeight
    if (!ref.isCollapsed) ref.openSize = ref.size
  }, [])

  let flexValue: string
  if (group.ratio) {
    flexValue = `${ref.size} ${ref.size} 0%`
  } else if (ref.expand) {
    flexValue = `1 1 0%`
  } else {
    flexValue = `0 1 ${ref.size}px`
  }

  return (
    <PanelContext.Provider value={{ ...ref }}>
      <div
        ref={containerEl}
        data-resizable-panel={ref.id}
        data-collapsed={ref.isCollapsed || undefined}
        data-maximized={ref.isMaximized || undefined}
        style={{
          flex: flexValue,
          display: "flex",
          overflow: "hidden",
          [isCol ? "minWidth" : "minHeight"]: ref.isCollapsed ? undefined : ref.minSize,
          [isCol ? "maxWidth" : "maxHeight"]: ref.maxSize === Infinity ? undefined : ref.maxSize,
        }}
        className={className}
      >
        {children}
      </div>
    </PanelContext.Provider>
  )
}
