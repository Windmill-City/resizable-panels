"use client"

import { createContext, useContext, useEffect, useId, useRef } from "react"
import type {
  ContextValue,
  Direction,
  GroupValue,
  PanelValue,
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
    const rect = group.containerEl.current!.getBoundingClientRect()

    // Skip if point is not within group bounds (with margin)
    if (
      point.x < rect.x - margin ||
      point.x > rect.right + margin ||
      point.y < rect.top - margin ||
      point.y > rect.bottom + margin
    ) {
      continue
    }

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

/**
 * Distributes space sequentially among panels starting from the resize handle.
 *
 * When growing: distributes space to panels with expand=true first,
 * then to all non-collapsed panels. Respects maxSize constraints.
 * When shrinking: collects space from panels closest to the handle.
 * Respects minSize constraints and collapsed state.
 *
 * @param panels - Array of panels to distribute space among
 * @param amount - Amount of space to distribute/collect (in pixels)
 * @param isGrowing - If true, distribute space; if false, collect space
 * @param reverseOrder - If true, iterate from end of array
 */
function distributeSequentially(
  panels: PanelValue[],
  amount: number,
  isGrowing: boolean,
  reverseOrder: boolean,
): void {
  if (amount <= 0) return

  // Determine iteration order
  // Before panels need reverse order (end of array first = closest to handle)
  // After panels need normal order (start of array first = closest to handle)
  const orderedPanels = reverseOrder ? [...panels].reverse() : panels

  let remaining = amount

  if (isGrowing) {
    // Growing: distribute space evenly to all expandable panels
    // If no expand panels, give all space to the first non-collapsed panel
    const expandablePanels = orderedPanels.filter(
      (p) => !p.isCollapsed && p.expand,
    )

    if (expandablePanels.length > 0) {
      // Distribute space evenly among expandable panels
      const spacePerPanel = Math.floor(amount / expandablePanels.length)
      const remainder = amount % expandablePanels.length
      for (let i = 0; i < expandablePanels.length; i++) {
        const panel = expandablePanels[i]
        // Distribute remainder to first panel
        panel.size += spacePerPanel + (i === 0 ? remainder : 0)
      }
    } else {
      // No expandable panels: give all space to the first non-collapsed panel
      const firstNonCollapsed = orderedPanels.find((p) => !p.isCollapsed)
      if (firstNonCollapsed) {
        firstNonCollapsed.size += amount
      } else if (orderedPanels.length > 0) {
        // All panels collapsed: expand the first panel from the handle
        const firstPanel = orderedPanels[0]!
        if (amount > firstPanel.minSize / 2) {
          firstPanel.isCollapsed = false
          // Expand panel to at least its minSize, or more if dragged further
          firstPanel.size = Math.max(firstPanel.minSize, amount)
        }
      }
    }

    // Growing is unlimited, so all the space should be distributed
  } else {
    // Shrinking: reduce size from panels closest to handle
    // Collect space from panels one by one until enough
    for (const panel of orderedPanels) {
      if (remaining <= 0) break
      if (panel.isCollapsed) continue

      const minSize = panel.minSize
      if (panel.size > minSize) {
        // Take as much as possible from this panel
        const available = panel.size - minSize
        const take = Math.min(available, remaining)
        panel.size -= take
        remaining -= take
      }
    }

    console.assert(!remaining, "Unable to collect required size:", {
      amount,
      remaining,
      orderedPanels,
    })
  }
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
      console.debug(
        "[ResizableContext] Register group:",
        group.id,
        "Groups:",
        Array.from(ref.groups.keys()),
      )
    },
    unregisterGroup: (groupId: string) => {
      ref.groups.delete(groupId)
      console.debug(
        "[ResizableContext] Unregister group:",
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
        for (const [group] of ref.dragIndex.values()) {
          for (const [, panel] of group.panels) {
            panel.prevCollapsed = panel.isCollapsed
            // prevSize saves panel size before collapse, do not overwrite it
            if (!panel.isCollapsed) {
              panel.prevSize = panel.size
            }
          }
        }

        console.debug("[Resizable] MouseDown", {
          startPos: ref.startPos,
          dragIndex: ref.dragIndex,
        })
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Update cursor and hover state
      if (!ref.isDragging) {
        const edges = findEdgeIndexAtPoint(ref.groups, {
          x: e.clientX,
          y: e.clientY,
        })
        ref.hoverIndex = edges

        switch (edges.size) {
          case 0:
            // No edge: show default
            document.body.style.cursor = ""
            break
          case 1:
            const direction = edges.keys().next().value!
            // Single edge: show bidirectional arrow
            document.body.style.cursor =
              direction === "row" ? "ns-resize" : "ew-resize"
            break
          case 2:
            // Two edges (intersection): show crosshair
            document.body.style.cursor = "move"
            break
        }
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

        // Restore initial states
        for (const panel of [...panelsBefore, ...panelsAfter]) {
          panel.isCollapsed = panel.prevCollapsed
          panel.size = panel.isCollapsed ? 0 : panel.prevSize
        }

        // Calculate clamped delta considering collapsible panels
        let clamped = delta
        let collapsedSpace = 0 // Track space from collapsed panels to avoid double counting

        while (true) {
          const maxShrinkBefore = panelsBefore.reduce(
            (sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize),
            0,
          )
          const maxShrinkAfter = panelsAfter.reduce(
            (sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize),
            0,
          )

          if (delta > 0) {
            // Subtract collapsedSpace from maxShrink to avoid double counting
            clamped = Math.min(delta, maxShrinkAfter + collapsedSpace)
            // Try to collapse collapsible panels in panelsAfter if space is still needed
            const remaining = delta - clamped
            if (remaining > 0) {
              // Find collapsible panel from handle outwards (normal order for panelsAfter)
              const collapsiblePanel = panelsAfter.find(
                (p) => p.collapsible && !p.isCollapsed,
              )
              if (
                collapsiblePanel &&
                remaining > collapsiblePanel.minSize / 2
              ) {
                // Collapse this panel and track its space
                collapsedSpace += collapsiblePanel.size
                collapsiblePanel.isCollapsed = true
                collapsiblePanel.size = 0
                // Continue loop to recalculate clamped with new space
                continue
              }
            }
          } else if (delta < 0) {
            // Subtract collapsedSpace from maxShrink to avoid double counting
            clamped = Math.max(delta, -(maxShrinkBefore + collapsedSpace))
            // Try to collapse collapsible panels in panelsBefore if space is still needed
            const remaining = Math.abs(delta) - Math.abs(clamped)
            if (remaining > 0) {
              // Find collapsible panel from handle outwards (reverse order for panelsBefore)
              const collapsiblePanel = panelsBefore
                .slice()
                .reverse()
                .find((p) => p.collapsible && !p.isCollapsed)
              if (
                collapsiblePanel &&
                remaining > collapsiblePanel.minSize / 2
              ) {
                // Collapse this panel and track its space
                collapsedSpace += collapsiblePanel.size
                collapsiblePanel.isCollapsed = true
                collapsiblePanel.size = 0
                // Continue loop to recalculate clamped with new space
                continue
              }
            }
          }
          break
        }

        // Distribute space sequentially from the resize handle
        const growAmount = Math.abs(clamped)
        const shrinkAmount = growAmount - collapsedSpace
        if (clamped > 0) {
          // panelsBefore grows (iterate from handle outwards = reverse)
          // panelsAfter shrinks (iterate from handle outwards = normal)
          distributeSequentially(panelsBefore, growAmount, true, true)
          distributeSequentially(panelsAfter, shrinkAmount, false, false)
        } else if (clamped < 0) {
          // panelsBefore shrinks (iterate from handle outwards = reverse)
          // panelsAfter grows (iterate from handle outwards = normal)
          distributeSequentially(panelsAfter, growAmount, true, false)
          distributeSequentially(panelsBefore, shrinkAmount, false, true)
        }

        // Update maximized state
        const filtered = [...panelsBefore, ...panelsAfter].filter(
          (p) => !p.isCollapsed,
        )
        if (filtered.length === 1) {
          const panel = filtered[0]
          group.setMaximize(panel.id)
        } else {
          if (filtered.length > 1) {
            group.setMaximize(undefined)
          }
        }

        console.debug("[Resizable] MouseMove:", {
          delta,
          clamped,
          group,
          filtered,
        })

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

      console.debug("[Resizable] MouseUp")

      // Call onLayoutChanged when drag ends
      if (ref.onLayoutChanged) {
        ref.onLayoutChanged(ref)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    console.debug("[Context] useEffect ContextValue:", ref)

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
