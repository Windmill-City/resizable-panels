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
  const refContainer = useRef<HTMLDivElement>(null)

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
    container: refContainer,
    setDirty,
  }).current

  useLayoutEffect(() => {
    context.registerPanel(ref)
    return () => context.unregisterPanel(id)
  })

  return (
    <div
      ref={refContainer}
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={ref.isCollapsed}
      data-maximized={ref.isMaximized}
      style={{
        flex: `0 0 ${ref.size}px`,
        display: "flex",
      }}
      className={className}
    >
      {children}
    </div>
  )
}
