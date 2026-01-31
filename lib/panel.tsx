"use client"

import { useId, useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

export function ResizablePanel({
  id: idProp,
  children,
  className = "",
  expand = false,
  defaultSize = 300,
  minSize = 200,
  maxSize = Infinity,
  collapsible = false,
  okMaximize = false,
}: ResizablePanelProps) {
  const group = useGroupContext()
  const [, setDirty] = useReducer(() => ({}), {})

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  console.assert(defaultSize >= minSize, `[ResizablePanel] defaultSize < minSize: ${id}`)
  console.assert(defaultSize <= maxSize, `[ResizablePanel] defaultSize > maxSize: ${id}`)
  console.assert(minSize <= maxSize, `[ResizablePanel] minSize > maxSize: ${id}`)

  const ref = useRef<PanelValue>({
    id,
    size: defaultSize,
    minSize,
    maxSize,
    defaultSize,
    expand,
    prevSize: defaultSize,
    collapsible,
    isCollapsed: false,
    prevCollapsed: false,
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

    // Observe size changes and update ref.size (content-box)
    const observer = new ResizeObserver((_) => {
      if (!group.isDragging) ref.size = isCol ? el.clientWidth : el.clientHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerEl}
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      style={{
        flex: ref.expand && !ref.isCollapsed ? `1 1 0%` : `0 1 ${ref.size}px`,
        display: "flex",
        overflow: "hidden",
        [isCol ? "minWidth" : "minHeight"]: ref.isCollapsed ? 0 : ref.minSize,
        [isCol ? "maxWidth" : "maxHeight"]: ref.maxSize === Infinity ? undefined : ref.maxSize,
      }}
      className={className}
    >
      {children}
    </div>
  )
}
