"use client"

import { createContext, useContext, useEffect, useId, useRef } from "react"
import type {
  ContextValue,
  GroupValue,
  Orientation,
  ResizableContextProps,
} from "./types"
import { LayoutEvent } from "./types"

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
const HANDLE_SIZE = 8

/**
 * Finds the edges near a given point within all resizable groups.
 *
 * Iterates through all groups and checks if the point is near any edge
 * of a resizable group. Returns a map of orientation to group and edge index.
 *
 * @param groups - Map of group IDs to GroupValue objects
 * @param point - The point coordinates {x, y} to check (viewport coordinates)
 * @returns A Map where keys are orientations ("horizontal" | "vertical") and
 *          values are tuples of [GroupValue, edgeIndex]. Edge index i represents
 *          the boundary between panel[i] and panel[i+1].
 */
function findEdgeIndexAtPoint(
  groups: Map<string, GroupValue>,
  point: { x: number; y: number },
): Map<Orientation, [GroupValue, number]> {
  const result = new Map<Orientation, [GroupValue, number]>()

  for (const group of groups.values()) {
    const margin = HANDLE_SIZE / 2
    const panels = Array.from(group.panels.values())

    if (group.orientation === "horizontal") {
      // Calculate edge positions along x-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        const panel = panels[i].container.current!
        const rect = panel.getBoundingClientRect()
        const edgeX = rect.right
        if (Math.abs(point.x - edgeX) <= margin) {
          result.set("horizontal", [group, i])
          break
        }
      }
    } else {
      // Calculate edge positions along y-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        const panel = panels[i].container.current!
        const rect = panel.getBoundingClientRect()
        const edgeY = rect.bottom
        if (Math.abs(point.y - edgeY) <= margin) {
          result.set("vertical", [group, i])
          break
        }
      }
    }
  }

  return result
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
    isDragging: false,
    startPos: { x: 0, y: 0 },
    openStates: new Map(),
    dragIndex: new Map(),
    hoverIndex: new Map(),
  }).current

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      })
      if (edges.size) {
        // Set startPos and dragIndex before calling Pre event
        ref.startPos = { x: e.clientX, y: e.clientY }
        ref.dragIndex = edges
        ref.isDragging = true
        e.preventDefault()
        // Call onLayoutEvent with Pre phase
        if (ref.onLayoutEvent) {
          ref.onLayoutEvent(ref, LayoutEvent.Pre)
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      })
      ref.hoverIndex = edges

      if (!ref.isDragging || !ref.dragIndex.size) {
        return
      }

      const deltaX = e.clientX - ref.startPos.x
      const deltaY = e.clientY - ref.startPos.y

      let hasResized = false

      // Update panel sizes based on dragged edge
      for (const [group, index] of ref.dragIndex.values()) {
        const panels = Array.from(group.panels.values())
        const panelBefore = panels[index]
        const panelAfter = panels[index + 1]

        const delta = group.orientation === "horizontal" ? deltaX : deltaY

        // Calculate new sizes
        const newSizeBefore = panelBefore.size + delta
        const newSizeAfter = panelAfter.size - delta

        // Respect minimum size constraints
        if (
          newSizeBefore >= panelBefore.minSize &&
          newSizeAfter >= panelAfter.minSize
        ) {
          panelBefore.size = newSizeBefore
          panelAfter.size = newSizeAfter
          panelBefore.setDirty()
          panelAfter.setDirty()
          hasResized = true

          // Call onLayoutChange during dragging with OnGoing phase
          if (ref.onLayoutEvent) {
            ref.onLayoutEvent(ref, LayoutEvent.OnGoing)
          }
        }
      }

      // Only update startPos when actually resized to avoid drift
      if (hasResized) {
        ref.startPos = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = (_: MouseEvent) => {
      if (!ref.isDragging) {
        return
      }

      // Call onLayoutChange with Post phase when drag ends
      if (ref.onLayoutEvent) {
        ref.onLayoutEvent(ref, LayoutEvent.Post)
      }

      // Reset drag state
      ref.isDragging = false
      ref.dragIndex.clear()
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
