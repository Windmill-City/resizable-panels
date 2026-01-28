"use client"

import { createContext, useContext, useEffect, useId, useRef } from "react"
import type {
  ContextValue,
  GroupValue,
  Orientation,
  ResizableContextProps,
} from "./types"

export const ResizableContextType = createContext<ContextValue | null>(null)

export function useResizableContext() {
  const context = useContext(ResizableContextType)
  if (!context) {
    throw new Error("useResizableContext must be used within ResizableContext")
  }
  return context
}

/**
 * The size of the resize handle (px)
 * Used to determine the tolerance area around edges.
 */
const HANDLE_SIZE = 4

/**
 * Finds the edge index at a given point within all resizable groups.
 *
 * Iterates through all groups and checks if the point is near any edge
 * of a resizable group. Returns a map of orientation to edge index.
 *
 * @param groups - Map of group IDs to GroupValue objects
 * @param point - The point coordinates {x, y} to check (viewport coordinates)
 * @returns A Map where keys are orientations ("horizontal" | "vertical") and
 *          values are the corresponding edge indices. Edge index i represents
 *          the boundary between panel[i-1] and panel[i].
 */
function findEdgeIndexAtPoint(
  groups: Map<string, GroupValue>,
  point: { x: number; y: number },
): Map<Orientation, number> {
  const result = new Map<Orientation, number>()

  for (const group of groups.values()) {
    const container = group.container.current!

    const margin = HANDLE_SIZE / 2
    const rect = container.getBoundingClientRect()
    const panels = Array.from(group.panels.values())

    if (group.orientation === "horizontal") {
      // Calculate edge positions along x-axis
      let currentX = rect.left
      for (let i = 0; i < panels.length - 1; i++) {
        currentX += panels[i].size
        if (Math.abs(point.x - currentX) <= margin) {
          result.set("horizontal", i)
          break
        }
      }
    } else {
      // Calculate edge positions along y-axis
      let currentY = rect.top
      for (let i = 0; i < panels.length - 1; i++) {
        currentY += panels[i].size
        if (Math.abs(point.y - currentY) <= margin) {
          result.set("vertical", i)
          break
        }
      }
    }
  }

  return result
}

interface InternalState {
  // Is Dragging Panels?
  isDragging: boolean
  // MouseDown Pos
  startPos: { x: number; y: number }
  // Panel Open States
  // indexed by the same index as GroupValue.panels
  openStates: Map<Orientation, boolean[]>
  // Index of the resize handle (edge) being dragged
  // For panels [P0, P1], edges are indexed as:
  //    V - Edge Index: 1 (drag handle between P0 and P1)
  // |P0|P1|
  // 0  1  2   (edge positions)
  dragIndex: Map<Orientation, number>
  // Index of the resize handle (edge) being hover
  hoverIndex: Map<Orientation, number>
}

export function ResizableContext({
  id: idProp,
  children,
  className = "",
}: ResizableContextProps) {
  const id = idProp ?? useId()

  const ref = useRef<ContextValue>({
    id,
    groups: new Map<string, GroupValue>(),
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

  const state = useRef<InternalState>({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    openStates: new Map(),
    dragIndex: new Map(),
    hoverIndex: new Map(),
  }).current

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, { x: e.clientX, y: e.clientY })
      if (edges.size > 0) {
        state.isDragging = true
        state.startPos = { x: e.clientX, y: e.clientY }
        state.dragIndex = edges
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, { x: e.clientX, y: e.clientY })
      state.hoverIndex = edges

      if (!state.isDragging || state.dragIndex.size === 0) {
        return
      }

      const deltaX = e.clientX - state.startPos.x
      const deltaY = e.clientY - state.startPos.y

      // Update panel sizes based on dragged edge
      for (const group of ref.groups.values()) {
        const edgeIndex = state.dragIndex.get(group.orientation)
        if (edgeIndex === undefined) continue

        const panels = Array.from(group.panels.values())
        if (edgeIndex < 0 || edgeIndex >= panels.length - 1) continue

        const panelBefore = panels[edgeIndex]
        const panelAfter = panels[edgeIndex + 1]

        const delta = group.orientation === "horizontal" ? deltaX : deltaY

        // Calculate new sizes
        const newSizeBefore = panelBefore.size + delta
        const newSizeAfter = panelAfter.size - delta

        // Respect minimum size constraints
        if (newSizeBefore >= panelBefore.minSize && newSizeAfter >= panelAfter.minSize) {
          panelBefore.size = newSizeBefore
          panelAfter.size = newSizeAfter
          panelBefore.setDirty()
          panelAfter.setDirty()

          // Call onLayoutChange during dragging
          if (ref.onLayoutChange) {
            const sizes: Record<string, number> = {}
            for (const [id, panel] of group.panels) {
              sizes[id] = panel.size
            }
            ref.onLayoutChange(sizes)
          }
        }
      }

      // Update start position for next move event
      state.startPos = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!state.isDragging) {
        return
      }

      // Call onLayoutChanged when drag ends
      if (ref.onLayoutChanged) {
        for (const group of ref.groups.values()) {
          const sizes: Record<string, number> = {}
          for (const [id, panel] of group.panels) {
            sizes[id] = panel.size
          }
          ref.onLayoutChanged(sizes)
        }
      }

      // Reset drag state
      state.isDragging = false
      state.dragIndex.clear()
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  })

  return (
    <ResizableContextType.Provider value={ref}>
      <div
        data-resizable-context
        data-context-id={id}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: "fit-content",
          minHeight: "fit-content",
        }}
        className={className}
      >
        {children}
      </div>
    </ResizableContextType.Provider>
  )
}
