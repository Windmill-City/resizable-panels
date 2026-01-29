"use client"

import { createContext, useContext, useEffect, useId, useRef } from "react"
import type {
  ContextValue,
  Direction,
  GroupValue,
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
const HANDLE_SIZE = 8

/**
 * Finds the edges near a given point within all resizable groups.
 *
 * Iterates through all groups and checks if the point is near any edge
 * of a resizable group. Returns a map of orientation to group and edge index.
 *
 * @param groups - Map of group IDs to GroupValue objects
 * @param point - The point coordinates {x, y} to check (viewport coordinates)
 * @returns A Map where keys are directions ("row" | "col") and
 *          values are tuples of [GroupValue, edgeIndex]. Edge index i represents
 *          the boundary between panel[i] and panel[i+1].
 */
function findEdgeIndexAtPoint(
  groups: Map<string, GroupValue>,
  point: { x: number; y: number },
): Map<Direction, [GroupValue, number]> {
  const result = new Map<Direction, [GroupValue, number]>()

  for (const group of groups.values()) {
    const margin = HANDLE_SIZE / 2
    const panels = Array.from(group.panels.values())

    if (group.direction === "row") {
      // Calculate edge positions along y-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        const panel = panels[i].containerEl.current!
        const rect = panel.getBoundingClientRect()
        const edgeY = rect.bottom
        if (Math.abs(point.y - edgeY) <= margin) {
          result.set("row", [group, i])
          break
        }
      }
    } else {
      // Calculate edge positions along x-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        const panel = panels[i].containerEl.current!
        const rect = panel.getBoundingClientRect()
        const edgeX = rect.right
        if (Math.abs(point.x - edgeX) <= margin) {
          result.set("col", [group, i])
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
  onLayoutChanged,
}: ResizableContextProps) {
  const id = idProp ?? useId()

  const ref = useRef<ContextValue>({
    id,
    groups: new Map<string, GroupValue>(),
    registerGroup: (group: GroupValue) => {
      ref.groups.set(group.id, group)
      console.log(
        "[Context] Register group:",
        group.id,
        "Groups:",
        Array.from(ref.groups.keys()),
      )
    },
    unregisterGroup: (groupId: string) => {
      ref.groups.delete(groupId)
      console.log(
        "[Context] Unregister group:",
        groupId,
        "Groups:",
        Array.from(ref.groups.keys()),
      )
    },
    onLayoutChanged,
    isDragging: false,
    startPos: { x: 0, y: 0 },
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
        ref.startPos = { x: e.clientX, y: e.clientY }
        ref.dragIndex = edges
        ref.isDragging = true

        // Save Initial State
        for (const [group, index] of ref.dragIndex.values()) {
          const panels = Array.from(group.panels.values())
          const panelBefore = panels[index]!
          const panelAfter = panels[index + 1]!

          console.log(
            "[Context] MouseDown: ",
            "panelBefore:",
            panelBefore.id,
            "size:",
            panelBefore.size,
            "panelAfter:",
            panelAfter.id,
            "size:",
            panelAfter.size,
          )

          panelBefore.prevSize = panelBefore.size
          panelBefore.prevCollapsed = panelBefore.isCollapsed
          panelAfter.prevSize = panelAfter.size
          panelAfter.prevCollapsed = panelAfter.isCollapsed
        }

        e.preventDefault()
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

      console.log(
        "[Context] MouseMove - groups:",
        Array.from(ref.groups.entries()).map(([k, v]) => [
          k,
          { dir: v.direction, panels: Array.from(v.panels.keys()) },
        ]),
      )

      // Distribute size across the panel
      for (const [group, index] of ref.dragIndex.values()) {
        const panels = Array.from(group.panels.values())
        const panelBefore = panels[index]!
        const panelAfter = panels[index + 1]!

        console.log(
          "[Context] MouseMove:",
          "panelBefore:",
          panelBefore.id,
          "prevSize:",
          panelBefore.prevSize,
          "panelAfter:",
          panelAfter.id,
          "prevSize:",
          panelAfter.prevSize,
          "delta:",
          group.direction === "row" ? deltaY : deltaX,
        )

        // Get delta based on direction
        // delta > 0 means edge moved down/right (panelBefore grows, panelAfter shrinks)
        const delta = group.direction === "row" ? deltaY : deltaX

        // panelBefore: positive delta means growing (edge moves down/right)
        // panelAfter: positive delta means shrinking (edge moves down/right)
        let newSizeBefore = panelBefore.prevSize + delta
        let newSizeAfter = panelAfter.prevSize - delta

        // Handle collapse for panelBefore
        if (panelBefore.collapsible && !panelBefore.isCollapsed) {
          if (newSizeBefore < panelBefore.minSize / 2) {
            panelBefore.isCollapsed = true
            newSizeBefore = 0
            // Give all space to panelAfter
            newSizeAfter = panelBefore.prevSize + panelAfter.prevSize
          }
        } else if (
          panelBefore.isCollapsed &&
          newSizeBefore > panelBefore.minSize / 2
        ) {
          // Expand from collapsed state
          panelBefore.isCollapsed = false
        }

        // Handle collapse for panelAfter
        if (panelAfter.collapsible && !panelAfter.isCollapsed) {
          if (newSizeAfter < panelAfter.minSize / 2) {
            panelAfter.isCollapsed = true
            newSizeAfter = 0
            // Give all space to panelBefore
            newSizeBefore = panelBefore.prevSize + panelAfter.prevSize
          }
        } else if (
          panelAfter.isCollapsed &&
          newSizeAfter > panelAfter.minSize / 2
        ) {
          // Expand from collapsed state
          panelAfter.isCollapsed = false
        }

        // Apply minimum size constraints for non-collapsed panels
        if (!panelBefore.isCollapsed) {
          newSizeBefore = Math.max(newSizeBefore, panelBefore.minSize)
        }
        if (!panelAfter.isCollapsed) {
          newSizeAfter = Math.max(newSizeAfter, panelAfter.minSize)
        }

        // Update panel sizes
        panelBefore.size = newSizeBefore
        panelAfter.size = newSizeAfter

        // Trigger re-render
        panelBefore.setDirty()
        panelAfter.setDirty()
      }
    }

    const handleMouseUp = (_: MouseEvent) => {
      if (!ref.isDragging) {
        return
      }

      // Reset drag state
      ref.isDragging = false
      ref.dragIndex.clear()

      console.log("[Context] MouseUp ContextValue:", ref)

      // Call onLayoutChanged when drag ends
      if (ref.onLayoutChanged) {
        ref.onLayoutChanged(ref)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    console.log("[Context] useEffect ContextValue:", ref)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <ResizableContextType.Provider value={ref}>
      <div
        data-resizable-context
        data-context-id={id}
        style={{
          flex: 1,
          display: "flex",
        }}
        className={className}
      >
        {children}
      </div>
    </ResizableContextType.Provider>
  )
}
