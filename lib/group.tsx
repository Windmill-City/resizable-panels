"use client"

import { createContext, useContext } from "react"
import type { GroupValue, ResizableGroupProps } from "./types"

export const GroupContext = createContext<GroupValue | null>(null)

export function useGroupContext() {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error("useGroupContext must be used within ResizableGroup")
  }
  return context
}

export function ResizableGroup({
  id,
  children,
  orientation = "horizontal",
  className = "",
}: ResizableGroupProps) {
  const ctxGroup = {};

  return (
    <div
      data-resizable-group
      data-group-id={id}
      data-orientation={orientation}
      className={className}
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  )
}
