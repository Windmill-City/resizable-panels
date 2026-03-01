"use client"

import { useId, useLayoutEffect, useRef, useState } from "react"
import { useGroupContext } from "./group"
import type { HandleProps, HandleValue } from "./types"

export function ResizableHandle({ className = undefined, children, onClick, onDoubleClick }: HandleProps) {
  const group = useGroupContext()

  const id = useId()
  const [isHover, setHover] = useState(false)

  const ref = useRef<HandleValue>({
    id,
    isHover,
    setHover,
    onClick,
    onDoubleClick,
  }).current

  useLayoutEffect(() => {
    group.registerHandle(ref)
    return () => group.unregisterHandle(ref.id)
  }, [])

  ref.isHover = isHover
  ref.onClick = onClick
  ref.onDoubleClick = onDoubleClick

  return (
    <div
      data-resizable-handle={ref.id}
      data-direction={group.direction}
      data-hover={ref.isHover || undefined}
      className={className}
    >
      {children}
    </div>
  )
}
