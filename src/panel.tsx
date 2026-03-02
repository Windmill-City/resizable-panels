"use client"

import { createContext, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useResizableContext } from "./context"
import { useGroupContext } from "./group"
import type { PanelProps, PanelValue } from "./types"

export const PanelContext = createContext<PanelValue | null>(null)

export function usePanelContext() {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error("usePanelContext must be used within ResizablePanel")
  }
  return context
}

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
}: PanelProps) {
  const context = useResizableContext()
  const group = useGroupContext()

  const id = idProp ?? useId()
  const containerEl = useRef<HTMLDivElement>(null)

  if (!group.ratio) {
    console.assert(defaultSize >= minSize, "[Panel] defaultSize < minSize:", {
      id,
      defaultSize,
      minSize,
      maxSize,
    })
    console.assert(defaultSize <= maxSize, "[Panel] defaultSize > maxSize:", {
      id,
      defaultSize,
      minSize,
      maxSize,
    })
  }
  console.assert(minSize <= maxSize, "[Panel] minSize > maxSize:", {
    id,
    minSize,
    maxSize,
  })
  console.assert(minSize >= 0, "[Panel] minSize < 0:", { id, minSize, maxSize })

  const [size, setSize] = useState(collapsed ? 0 : defaultSize)
  const [isCollapsed, setCollapsed] = useState(collapsed)
  const [isMaximized, setMaximized] = useState(false)

  const ref = useRef<PanelValue>({
    id,
    size,
    openSize: defaultSize,
    defaultSize: defaultSize,
    expand,
    minSize,
    maxSize,
    collapsible,
    isCollapsed,
    okMaximize,
    isMaximized,
    prevDrag: [collapsed, defaultSize],
    prevMaximize: [collapsed, defaultSize],
    containerEl,
    setDirty: () => {
      setSize(ref.size)
      setCollapsed(ref.isCollapsed)
      setMaximized(ref.isMaximized)
    },
    updateSizeFromDOM: () => {
      if (ref.isCollapsed) return

      const el = ref.containerEl.current!
      const isCol = group.direction === "col"

      const newSize = isCol ? el.offsetWidth : el.offsetHeight

      console.debug("[Resize] Panel:", { id: ref.id, oldSize: ref.openSize, newSize: newSize })
      ref.size = newSize
      ref.openSize = newSize

      context.notify()
    },
  }).current

  ref.expand = expand
  ref.minSize = minSize
  ref.maxSize = maxSize
  ref.defaultSize = defaultSize
  ref.collapsible = collapsible
  ref.okMaximize = okMaximize

  useLayoutEffect(() => {
    group.registerPanel(ref)
    return () => group.unregisterPanel(ref.id)
  }, [])

  useLayoutEffect(() => {
    const observer = new ResizeObserver((_) => {
      ref.updateSizeFromDOM()
    })
    observer.observe(ref.containerEl.current!)
    return () => observer.disconnect()
  }, [])

  let flexValue: string
  if (ref.isMaximized || ref.expand) {
    flexValue = `1 1 0%`
  } else if (group.ratio) {
    flexValue = `${ref.size} ${ref.size} 0%`
  } else {
    flexValue = `0 1 ${ref.size}px`
  }

  const isCol = group.direction === "col"
  const value = useMemo(() => ({ ...ref }), [ref.isMaximized, ref.isCollapsed])

  return (
    <PanelContext.Provider value={value}>
      <div
        hidden={ref.isCollapsed}
        ref={containerEl}
        data-resizable-panel={ref.id}
        data-collapsed={ref.isCollapsed || undefined}
        data-maximized={ref.isMaximized || undefined}
        style={{
          flex: flexValue,
          overflow: "hidden",
          [isCol ? "minWidth" : "minHeight"]: ref.minSize,
          [isCol ? "maxWidth" : "maxHeight"]: ref.maxSize === Infinity ? undefined : ref.maxSize,
        }}
        className={className}
      >
        {children}
      </div>
    </PanelContext.Provider>
  )
}
