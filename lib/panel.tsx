"use client"

import { useId, useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

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

  console.assert(defaultSize >= minSize, `[ResizablePanel] defaultSize < minSize: ${id}`)
  console.assert(defaultSize <= maxSize, `[ResizablePanel] defaultSize > maxSize: ${id}`)
  console.assert(minSize <= maxSize, `[ResizablePanel] minSize > maxSize: ${id}`)

  const ref = useRef<PanelValue>({
    id,
    size: collapsed ? 0 : defaultSize,
    minSize,
    maxSize,
    expand,
    prevSize: defaultSize,
    collapsible,
    isCollapsed: collapsed,
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
    ref.prevSize = Math.max(ref.prevSize, ref.size)

    // Observe size changes and update ref.size (content-box)
    const observer = new ResizeObserver((_) => {
      if (!group.isDragging) ref.size = isCol ? el.clientWidth : el.clientHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  let flexValue: string
  if (group.ratio) {
    flexValue = `${ref.size} ${ref.size} 0%`
  } else if (ref.isCollapsed) {
    flexValue = `0 1 ${ref.size}px`
  } else if (ref.expand) {
    flexValue = `999 1 0%`
  } else {
    flexValue = `1 1 ${ref.size}px`
  }

  return (
    <div
      ref={containerEl}
      data-resizable-panel={id}
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
  )
}
