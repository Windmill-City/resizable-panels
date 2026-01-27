"use client"

import { createContext, useContext } from "react"
import type { ContextValue } from "./types"

export const ResizableContext = createContext<ContextValue | null>(null)

export function useResizableContext() {
  const context = useContext(ResizableContext)
  if (!context) {
    throw new Error("useResizableContext must be used within ResizableContext")
  }
  return context
}
