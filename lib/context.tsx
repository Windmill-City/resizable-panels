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

          panelBefore.prevSize = panelBefore.size
          panelBefore.prevCollapsed = panelBefore.isCollapsed
          panelAfter.prevSize = panelAfter.size
          panelAfter.prevCollapsed = panelAfter.isCollapsed
        }

        console.log("[Resizable] MouseDown", {
          startPos: ref.startPos,
          dragIndex: ref.dragIndex,
        })
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

      // Distribute size across the panel
      for (const [group, index] of ref.dragIndex.values()) {
        const panels = Array.from(group.panels.values())
        const panelsBefore = panels.slice(0, index + 1)
        const panelsAfter = panels.slice(index + 1)

        // Get delta based on direction
        // delta > 0 means edge moved down/right (panelsBefore grows, panelsAfter shrinks)
        const delta = group.direction === "row" ? deltaY : deltaX

        console.log("[Resizable] MouseMove", {
          startPos: ref.startPos,
          delta,
          index,
          group,
          panelsBefore,
          panelsAfter,
        })

        // Calculate total prevSize for panels on each side
        const totalPrevSizeBefore = panelsBefore.reduce(
          (sum, p) => sum + p.prevSize,
          0,
        )
        const totalPrevSizeAfter = panelsAfter.reduce(
          (sum, p) => sum + p.prevSize,
          0,
        )

        // Calculate new total sizes for each side
        let newTotalSizeBefore = totalPrevSizeBefore + delta
        let newTotalSizeAfter = totalPrevSizeAfter - delta

        // Get panels closest to the resize handle
        const lastPanelBefore = panelsBefore[panelsBefore.length - 1]!
        const firstPanelAfter = panelsAfter[0]!

        // Handle collapse/expand for panel closest to handle on "before" side
        if (lastPanelBefore.collapsible) {
          if (
            !lastPanelBefore.isCollapsed &&
            newTotalSizeBefore < lastPanelBefore.minSize / 2
          ) {
            // Collapse: drag handle moved too far, panel before collapses
            lastPanelBefore.isCollapsed = true
          } else if (
            lastPanelBefore.isCollapsed &&
            newTotalSizeBefore > lastPanelBefore.minSize / 2
          ) {
            // Expand: drag handle moved back, panel before expands
            lastPanelBefore.isCollapsed = false
          }
        }

        // Handle collapse/expand for panel closest to handle on "after" side
        if (firstPanelAfter.collapsible) {
          if (
            !firstPanelAfter.isCollapsed &&
            newTotalSizeAfter < firstPanelAfter.minSize / 2
          ) {
            // Collapse: drag handle moved too far, panel after collapses
            firstPanelAfter.isCollapsed = true
          } else if (
            firstPanelAfter.isCollapsed &&
            newTotalSizeAfter > firstPanelAfter.minSize / 2
          ) {
            // Expand: drag handle moved back, panel after expands
            firstPanelAfter.isCollapsed = false
          }
        }

        // Initialize sizes: collapsed panels get 0, others get at least minSize
        for (const panel of [...panelsBefore, ...panelsAfter]) {
          if (panel.isCollapsed) {
            panel.size = 0
          } else {
            // Ensure size is at least minSize when expanding
            panel.size = Math.max(panel.prevSize, panel.minSize)
          }
        }

        // Distribute space sequentially from the resize handle
        // If delta > 0: panelsBefore grows, panelsAfter shrinks
        // If delta < 0: panelsBefore shrinks, panelsAfter grows

        const distributeSequentially = (
          panels: typeof panelsBefore,
          amount: number,
          isGrowing: boolean,
          reverseOrder: boolean,
        ) => {
          if (amount <= 0) return 0

          // Determine iteration order
          // reverseOrder: true means start from panel closest to handle (end of array)
          const orderedPanels = reverseOrder ? [...panels].reverse() : panels

          let remaining = amount

          for (const panel of orderedPanels) {
            if (remaining <= 0) break

            if (isGrowing) {
              // Skip collapsed panels (they stay at 0 until expanded)
              if (panel.isCollapsed) {
                continue
              }
              // Growing: only expand panels with expand=true
              if (panel.expand) {
                panel.size += remaining
                remaining = 0
                break
              }
              // Non-expand panel: keep current size, continue to next
            } else {
              // Shrinking: reduce size from minSize, can collapse if collapsible
              if (panel.isCollapsed) {
                // Already collapsed, skip to next
                continue
              }

              const minSize = panel.minSize
              const available = panel.size - minSize

              if (available >= remaining) {
                // This panel can provide all needed space
                panel.size -= remaining
                remaining = 0
                break
              } else {
                // This panel can't provide enough, take what it can give
                // Reduce to minimum and continue to next panel
                panel.size = minSize
                remaining -= available
              }
            }
          }

          // If still have remaining space to grow but no expand panels found,
          // give it to the panel closest to handle (skip collapsed panels)
          if (isGrowing && remaining > 0 && panels.length > 0) {
            const targetPanel = reverseOrder
              ? panels[panels.length - 1]!
              : panels[0]!
            if (!targetPanel.isCollapsed) {
              targetPanel.size += remaining
              remaining = 0
            }
          }

          return amount - remaining
        }

        if (delta > 0) {
          // panelsBefore grows (iterate from handle outwards = reverse)
          // panelsAfter shrinks (iterate from handle outwards = normal)
          distributeSequentially(panelsBefore, delta, true, true)
          distributeSequentially(panelsAfter, delta, false, false)
        } else if (delta < 0) {
          // panelsBefore shrinks (iterate from handle outwards = reverse)
          // panelsAfter grows (iterate from handle outwards = normal)
          const absDelta = -delta
          distributeSequentially(panelsBefore, absDelta, false, true)
          distributeSequentially(panelsAfter, absDelta, true, false)
        }

        // Trigger re-render for all affected panels
        for (const panel of [...panelsBefore, ...panelsAfter]) {
          panel.setDirty()
        }
      }
    }

    const handleMouseUp = (_: MouseEvent) => {
      if (!ref.isDragging) {
        return
      }

      // Reset drag state
      ref.isDragging = false
      ref.dragIndex.clear()

      console.log("[Resizable] MouseUp")

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
