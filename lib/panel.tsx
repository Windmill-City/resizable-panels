"use client"

import { useId, useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

export function ResizablePanel({
  id: idProp,
  children,
  className = "",
  keepSize = false,
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
    keepSize,
    prevSize: defaultSize,
    collapsible,
    isCollapsed: false,
    prevCollapsed: false,
    okMaximize,
    isMaximized: false,
    containerEl,
    setDirty,
  }).current

  useLayoutEffect(() => {
    context.registerPanel(ref)
    return () => context.unregisterPanel(id)
  })

  const isCol = context.direction === "col"

  return (
    <div
      ref={containerEl}
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      style={{
        flex: `${ref.keepSize ? 0 : 1} ${ref.keepSize ? 0 : 1} {${ref.size}px}`,
        display: "flex",
        [isCol ? "minWidth" : "minHeight"]: ref.minSize
      }}
      className={className}
    >
      {children}
    </div>
  )
}
