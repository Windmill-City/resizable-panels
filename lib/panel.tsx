"use client"

import { useLayoutEffect, useRef } from "react"
import { useGroupContext } from "./group"
import type { PanelValue, ResizablePanelProps } from "./types"

export function ResizablePanel({
  id,
  children,
  defaultSize = 200,
  minSize = 200,
  collapsible = false,
  okMaximize = false,
  className = "",
}: ResizablePanelProps) {
  const context = useGroupContext()

  const refPanelValue = useRef<PanelValue>({
    id,
    size: defaultSize,
    minSize,
    defaultSize,
    openSize: defaultSize,
    collapsible,
    isCollapsed: false,
    okMaximize,
    isMaximized: false,
  })

  useLayoutEffect(() => {
    context.registerPanel(refPanelValue.current)
    return () => context.unregisterPanel(id)
  })

  const ref = refPanelValue.current
  const isHorizontal = context.orientation === "horizontal"

  return (
    <div
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      className={className}
      style={{
        [isHorizontal ? "width" : "height"]: ref.size,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  )
}
