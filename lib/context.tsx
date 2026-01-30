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
 * The margin from window edges to exclude from edge detection (px)
 * Prevents conflict with window resize handles.
 */
const WINDOW_EDGE_MARGIN = 8

/**
 * Finds the edges near a given point within all resizable groups.
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

  // Skip if point is too close to window edges (to avoid conflict with window resize)
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  if (
    point.x < WINDOW_EDGE_MARGIN ||
    point.x > windowWidth - WINDOW_EDGE_MARGIN ||
    point.y < WINDOW_EDGE_MARGIN ||
    point.y > windowHeight - WINDOW_EDGE_MARGIN
  ) {
    return result
  }

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
 * Distributes space sequentially to panels (growing)
 *
 * @param panels - Array of panels to distribute space among
 * @param amount - Amount of space to distribute (in pixels)
 */
function growSequentially(panels: PanelValue[], amount: number): void {
  console.assert(
    amount >= 0,
    `[ResizableContext] Invalid Grow Space: ${amount}`,
  )
  if (amount <= 0) return

  let remaining = amount

  // Phase 1: Distribute space to expandable panels
  const expandablePanels = panels.filter((p) => !p.isCollapsed && p.expand)
  if (expandablePanels.length > 0) {
    const spacePerPanel = Math.floor(remaining / expandablePanels.length)
    const remainder = remaining % expandablePanels.length

    for (let i = 0; i < expandablePanels.length; i++) {
      const panel = expandablePanels[i]
      const allocated = spacePerPanel + (i === 0 ? remainder : 0)
      panel.size += allocated
      remaining -= allocated
    }

    console.assert(remaining === 0, "Space allocation error:", {
      amount,
      remaining,
    })
    return
  }

  // Phase 2: No expandable panels - give all space to first non-collapsed panel
  const firstNonCollapsed = panels.find((p) => !p.isCollapsed)
  if (firstNonCollapsed) {
    firstNonCollapsed.size += remaining
    remaining = 0
    return
  }

  // Phase 3: All panels collapsed - try to expand the first panel
  if (panels.length > 0) {
    const firstPanel = panels[0]!
    // Only expand if amount is significant (more than half of minSize)
    if (remaining > firstPanel.minSize / 2) {
      firstPanel.isCollapsed = false
      firstPanel.size = Math.max(remaining, firstPanel.minSize)
      remaining = 0
      return
    }
  }

  // Unable to allocate space
  console.assert(false, "Unable to allocate space:", {
    amount,
    remaining,
    panels,
  })
}

/**
 * Collects space sequentially from panels (shrinking)
 *
 * @param panels - Array of panels to collect space from
 * @param amount - Amount of space to collect (in pixels)
 */
function shrinkSequentially(panels: PanelValue[], amount: number): void {
  console.assert(
    amount >= 0,
    `[ResizableContext] Invalid Shrink Space: ${amount}`,
  )
  if (amount <= 0) return

  let remaining = amount

  // Shrinking: reduce size from panels closest to handle
  // Collect space from panels one by one until enough
  for (const panel of panels) {
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
    orderedPanels: panels,
  })
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
        const panelsBefore = panels.slice(0, index + 1).reverse()
        const panelsAfter = panels.slice(index + 1)

        // Get delta based on direction
        const delta = group.direction === "row" ? deltaY : deltaX

        // Restore initial states
        for (const panel of [...panelsBefore, ...panelsAfter]) {
          panel.isCollapsed = panel.prevCollapsed
          panel.size = panel.isCollapsed ? 0 : panel.prevSize
        }

        // Save prevTotalSize for diff check, diff should be 0 after resizing
        const prevTotalSize = [...panelsBefore, ...panelsAfter].reduce(
          (sum, panel) => sum + panel.size,
          0,
        )

        // clamped delta: max possible delta considering collapsible panels
        let clamped = delta
        // Space collected from collapsed panels
        let collapsedSpace = 0

        // Try to collapse a collapsible panel from the given panels if remaining space is needed
        const tryCollapsePanel = (
          panels: PanelValue[],
          remaining: number,
        ): boolean => {
          const nextPanel = panels.find((p) => p.collapsible && !p.isCollapsed)
          if (nextPanel && remaining > nextPanel.minSize / 2) {
            collapsedSpace += nextPanel.size
            nextPanel.isCollapsed = true
            nextPanel.size = 0
            return true
          }
          return false
        }

        while (true) {
          const maxGrowBefore =
            panelsBefore.every((panel) => panel.isCollapsed) &&
            Math.abs(delta) <= panelsBefore[0].minSize / 2
              ? 0
              : Math.abs(delta)

          const maxGrowAfter =
            panelsAfter.every((panel) => panel.isCollapsed) &&
            Math.abs(delta) <= panelsAfter[0].minSize / 2
              ? 0
              : Math.abs(delta)

          const maxShrinkBefore = panelsBefore.reduce(
            (sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize),
            0,
          )

          const maxShrinkAfter = panelsAfter.reduce(
            (sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize),
            0,
          )

          // delta > 0 means edge moved down/right (panelsBefore grows, panelsAfter shrinks)
          if (delta > 0) {
            clamped = Math.min(
              delta,
              maxShrinkAfter + collapsedSpace,
              maxGrowBefore,
            )

            // Try to collapse collapsible panels in panelsAfter if space is still needed
            const remaining = Math.abs(delta - clamped)
            if (remaining > 0 && tryCollapsePanel(panelsAfter, remaining)) {
              // Continue loop to recalculate clamped with new space
              continue
            }
            // Ensure clamped is at least collapsedSpace to respect minimum space after collapse
            clamped = Math.max(clamped, collapsedSpace)
          }

          // delta < 0 means edge moved left/top (panelsBefore shrinks, panelsAfter grows)
          if (delta < 0) {
            clamped = Math.max(
              delta,
              -(maxShrinkBefore + collapsedSpace),
              -maxGrowAfter,
            )

            // Try to collapse collapsible panels in panelsBefore if space is still needed
            const remaining = Math.abs(delta - clamped)
            if (remaining > 0 && tryCollapsePanel(panelsBefore, remaining)) {
              // Continue loop to recalculate clamped with new space
              continue
            }
            // Ensure clamped is at most -collapsedSpace to respect minimum space after collapse
            clamped = Math.min(clamped, -collapsedSpace)
          }
          break
        }

        // Distribute space sequentially from the resize handle
        const amount = Math.abs(clamped)
        if (clamped > 0) {
          growSequentially(panelsBefore, amount)
          shrinkSequentially(panelsAfter, amount - collapsedSpace)
        }
        if (clamped < 0) {
          growSequentially(panelsAfter, amount)
          shrinkSequentially(panelsBefore, amount - collapsedSpace)
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

        // Check and shrink excess size if total exceeds container
        // Shrink from panels that grew (based on delta direction), starting from handle
        // If not enough, shrink from the other side
        const currTotalSize = [...panelsBefore, ...panelsAfter].reduce(
          (sum, panel) => sum + panel.size,
          0,
        )

        let diff = currTotalSize - prevTotalSize
        console.assert(diff === 0, `Group size changed while resizing: ${diff}`)

        console.debug("[Resizable] MouseMove:", {
          delta,
          clamped,
          amount,
          collapsedSpace,
          prevTotalSize,
          currTotalSize,
          diff,
          group,
          nonCollapsed: filtered,
        })

        if (diff > 0) {
          // Determine which panels grew based on delta direction
          // delta > 0: panelsBefore grew, shrink from panelsBefore (closest to handle first = reverse order)
          // delta < 0: panelsAfter grew, shrink from panelsAfter (closest to handle first = normal order)
          const primaryPanels =
            delta > 0 ? [...panelsBefore].reverse() : panelsAfter
          const secondaryPanels =
            delta > 0 ? panelsAfter : [...panelsBefore].reverse()

          // Phase 1: Shrink from panels that grew (based on prevSize)
          for (const panel of primaryPanels) {
            if (diff <= 0) break
            if (panel.isCollapsed) continue
            const shrinkable = Math.max(0, panel.size - panel.minSize)
            const shrinkAmount = Math.min(shrinkable, diff)
            panel.size -= shrinkAmount
            diff -= shrinkAmount
          }

          // Phase 2: If still have excess, shrink from the other side (based on prevSize)
          if (diff > 0) {
            for (const panel of secondaryPanels) {
              if (diff <= 0) break
              if (panel.isCollapsed) continue
              const shrinkable = Math.max(0, panel.size - panel.minSize)
              const shrinkAmount = Math.min(shrinkable, diff)
              panel.size -= shrinkAmount
              diff -= shrinkAmount
            }
          }
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

      // Reset drag state after constraint check
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
