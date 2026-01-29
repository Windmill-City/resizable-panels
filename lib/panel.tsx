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
  collapsible = false,
  okMaximize = false,
}: ResizablePanelProps) {
  const context = useGroupContext()
  const [, setDirty] = useReducer(() => ({}), {})

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  const ref = useRef<PanelValue>({
    id,
    size: defaultSize,
    minSize,
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

  const isCol = context.direction === "col"

  useLayoutEffect(() => {
    context.registerPanel(ref)

    if (!expand) {
      return () => context.unregisterPanel(id)
    }

    // Observe size changes and update ref.size
    const el = containerEl.current!
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newSize = isCol
          ? entry.contentRect.width
          : entry.contentRect.height
        if (newSize > 0 && Math.abs(ref.size - newSize) > 1) {
          ref.size = newSize
        }
      }
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      context.unregisterPanel(id)
    }
  })

  return (
    <div
      ref={containerEl}
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      style={{
        flex: ref.expand ? `1 1 0%` : `0 0 ${ref.size}px`,
        display: "flex",
        [isCol ? "minWidth" : "minHeight"]: ref.minSize,
      }}
      className={className}
    >
      {children}
    </div>
  )
}
