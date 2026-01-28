"use client"

import { createContext, useContext, useId, useRef } from "react"
import type { ContextValue, GroupValue, ResizableContextProps } from "./types"

export const ResizableContextType = createContext<ContextValue | null>(null)

export function useResizableContext() {
  const context = useContext(ResizableContextType)
  if (!context) {
    throw new Error("useResizableContext must be used within ResizableContext")
  }
  return context
}

export function ResizableContext({
  id: idProp,
  children,
  className = "",
}: ResizableContextProps) {
  const refContainer = useRef<HTMLDivElement>(null)

  const id = idProp ?? useId()

  const ref = useRef<ContextValue>({
    id,
    groups: new Map<string, GroupValue>(),
    container: refContainer,
    registerGroup: (group: GroupValue) => {
      ref.groups.set(group.id, group)
    },
    unregisterGroup: (groupId: string) => {
      ref.groups.delete(groupId)
    },
    getGroup: (groupId: string): GroupValue => {
      const group = ref.groups.get(groupId)
      if (!group) {
        throw new Error(`[ResizableContext] Group not found: ${groupId}`)
      }
      return group
    },
  }).current

  return (
    <ResizableContextType.Provider value={ref}>
      <div
        ref={refContainer}
        data-resizable-context
        data-context-id={id}
        style={{
          overflow: "hidden",
        }}
        className={className}
      >
        {children}
      </div>
    </ResizableContextType.Provider>
  )
}
