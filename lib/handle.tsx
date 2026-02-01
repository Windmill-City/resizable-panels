"use client"

import { useEffect, useId, useLayoutEffect, useReducer, useRef } from "react"
import { useGroupContext } from "./group"
import type { HandleValue, ResizableHandleProps } from "./types"

export function ResizableHandle({ className = undefined, children, onClick, onDoubleClick }: ResizableHandleProps) {
  const group = useGroupContext()

  const id = useId()
  const [, setDirty] = useReducer(() => ({}), {})

  const ref = useRef<HandleValue>({
    id,
    index: group.handles.length,
    isHover: false,
    setDirty,
    onClick,
    onDoubleClick,
  }).current

  // Update callback when it changes
  useEffect(() => {
    ref.onClick = onClick
  }, [onClick])

  useEffect(() => {
    ref.onDoubleClick = onDoubleClick
  }, [onDoubleClick])

  useLayoutEffect(() => {
    group.registerHandle(ref)
    return () => group.unregisterHandle(id)
  }, [])

  return (
    <div
      data-resizable-handle={id}
      data-direction={group.direction}
      data-handle-index={ref.index}
      data-hover={ref.isHover || undefined}
      style={{
        flex: "0 0 auto",
      }}
      className={className}
    >
      {children}
    </div>
  )
}
