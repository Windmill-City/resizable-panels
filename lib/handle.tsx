"use client"

import { useId, useLayoutEffect, useRef } from "react"
import { useGroupContext } from "./group"
import type { HandleValue, ResizableHandleProps } from "./types"

export function ResizableHandle({ className = "", children }: ResizableHandleProps) {
  const group = useGroupContext()

  const id = useId()

  const ref = useRef<HandleValue>({
    id,
    index: group.handles.length,
    isHovered: false,
  }).current

  useLayoutEffect(() => {
    group.registerHandle(ref)
    return () => group.unregisterHandle(id)
  }, [])

  return (
    <div
      data-resizable-handle
      data-direction={group.direction}
      data-handle-index={ref.index}
      data-hovered={ref.isHovered || undefined}
      className={className}
    >
      {children}
    </div>
  )
}
