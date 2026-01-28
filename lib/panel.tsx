"use client"

import { useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

export function ResizablePanel({
  id,
  children,
  className = "",
  defaultSize = 200,
  minSize = 200,
  collapsible = false,
  okMaximize = false,
}: ResizablePanelProps) {
  const context = useGroupContext()
  const [, setDirty] = useReducer(() => ({}), {})

  const ref = useRef<PanelValue>({
    id,
    size: defaultSize,
    minSize,
    defaultSize,
    openSize: defaultSize,
    collapsible,
    isCollapsed: false,
    okMaximize,
    isMaximized: false,
    setDirty,
  }).current

  useLayoutEffect(() => {
    context.registerPanel(ref)
    return () => context.unregisterPanel(id)
  })

  const isHorizontal = context.orientation === "horizontal"

  return (
    <div
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      style={{
        [isHorizontal ? "width" : "height"]: ref.size,
        overflow: "hidden",
      }}
      className={className}
    >
      {children}
    </div>
  )
}
