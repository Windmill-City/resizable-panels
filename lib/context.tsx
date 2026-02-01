"use client"

import { createContext, useContext, useEffect, useId, useRef } from "react"
import type { ContextValue, Direction, GroupValue, PanelValue, ResizableContextProps } from "./types"

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
export const HANDLE_SIZE = 8

/**
 * The margin from window edges to exclude from edge detection (px)
 * Prevents conflict with window resize handles.
 */
export const WINDOW_EDGE_MARGIN = 8

/**
 * Finds the edges near a given point within all resizable groups.
 *
 * @param groups - Map of group IDs to GroupValue objects
 * @param point - The point coordinates {x, y} to check (viewport coordinates)
 * @param ignoreWindowEdge - Whether to ignore window edge margin check
 *                           (used for double-click to allow edge detection near window borders)
 * @returns A Map where keys are directions ("row" | "col") and
 *          values are tuples of [GroupValue, edgeIndex]. Edge index i represents
 *          the boundary between panel[i] and panel[i+1].
 */
export function findEdgeIndexAtPoint(
  groups: Map<string, GroupValue>,
  point: { x: number; y: number },
  ignoreWindowEdge = false,
): Map<Direction, [GroupValue, number]> {
  const result = new Map<Direction, [GroupValue, number]>()

  // Skip if point is too close to window edges (to avoid conflict with window resize)
  if (!ignoreWindowEdge) {
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
export function growSequentially(panels: PanelValue[], amount: number): void {
  console.assert(amount >= 0, `[Resizable] Invalid Grow Space: ${amount}`)
  if (amount <= 0) return

  let remaining = amount

  // Distribute space to panels one by one until enough
  for (const panel of panels) {
    if (remaining <= 0) break
    if (panel.isCollapsed) continue

    // Apply maxSize constraint
    if (panel.size < panel.maxSize) {
      const available = panel.maxSize - panel.size
      const give = Math.min(available, remaining)
      panel.size += give
      remaining -= give
    }
  }

  // All panels collapsed or all reached maxSize - this should not happen as expansion is handled in the resize loop
  console.assert(!remaining, "[Resizable] All panels collapsed or at maxSize, unable to allocate space:", {
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
export function shrinkSequentially(panels: PanelValue[], amount: number): void {
  console.assert(amount >= 0, `[Resizable] Invalid Shrink Space: ${amount}`)
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

  // All panels collapsed or all at minSize - this should not happen as it means there's no space to shrink
  console.assert(!remaining, "[Resizable] All panels collapsed or at minSize, unable to collect space:", {
    amount,
    remaining,
    panels,
  })
}

/**
 * Resizes panels by delta
 *
 * This function handles the complex logic of resizing panels when the user drags a resize handle.
 * It supports:
 * - Sequential space distribution (panels closest to the handle are affected first)
 * - Collapsing panels when they are dragged below half of their minimum size
 * - Expanding collapsed panels when there are space that need to distribute
 * - Maintaining total size constraints during resize operations
 *
 * The resize operation follows these steps:
 * 1. Calculate constraints for growing and shrinking panels
 * 2. Iteratively try to collapse or expand panels as needed
 * 3. Distribute the final clamped delta using sequential growth/shrinkage
 * 4. Update maximized state if only one panel remains uncollapsed
 * 5. Trigger re-renders for all affected panels
 *
 * @param panelsBefore - Panels before the resize handle (in reverse order, closest first)
 * @param panelsAfter - Panels after the resize handle
 * @param delta - The resize delta in pixels (positive = panelsBefore grows, negative = panelsBefore shrinks)
 * @param group - The group containing these panels, used for updating maximized state
 */
export function adjustPanelByDelta(
  panelsBefore: PanelValue[],
  panelsAfter: PanelValue[],
  delta: number,
  group: GroupValue,
): void {
  const panels = [...panelsBefore, ...panelsAfter]
  // Save prevTotalSize for diff check, diff should be 0 after resizing
  const prevTotalSize = panels.reduce((sum, panel) => sum + panel.size, 0)

  // clamped delta: max possible delta considering collapsible panels
  let clamped = delta
  // Space distributed by expanding panels
  let expandedSpace = 0
  // Space collected by collapsing panels
  let collapsedSpace = 0

  // Try to collapse a collapsible panel from the given panels if remaining space is needed
  const tryCollapsePanel = (panels: PanelValue[], remaining: number): boolean => {
    const nextPanel = panels.find((p) => p.collapsible && !p.isCollapsed)
    if (nextPanel && remaining > nextPanel.minSize / 2) {
      collapsedSpace += nextPanel.size
      nextPanel.isCollapsed = true
      nextPanel.size = 0
      console.debug("[Resizable] Collapsed Panel:", { panel: nextPanel, remaining })
      return true
    }
    return false
  }

  // Try to expand a collapsed panel from the given panels if there's enough space
  const tryExpandPanel = (panels: PanelValue[], remaining: number): boolean => {
    const nextPanel = panels.find((p) => p.collapsible && p.isCollapsed)
    if (nextPanel && remaining > nextPanel.minSize / 2) {
      expandedSpace += nextPanel.minSize
      nextPanel.isCollapsed = false
      nextPanel.size = nextPanel.minSize
      console.debug("[Resizable] Expanded Panel:", { panel: nextPanel, remaining })
      return true
    }
    return false
  }

  while (true) {
    // Constraints - the max possible grow/shrink that NOT considering the collapsed panels
    const maxGrowBeforeNoExpand = panelsBefore.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.maxSize - p.size), 0)
    const maxGrowAfterNoExpand = panelsAfter.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.maxSize - p.size), 0)
    const maxShrinkBeforeNoCollapse = panelsBefore.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize), 0)
    const maxShrinkAfterNoCollapse = panelsAfter.reduce((sum, p) => sum + (p.isCollapsed ? 0 : p.size - p.minSize), 0)

    console.debug("[Resizable] Constraints:", {
      maxGrowBeforeNoExpand,
      maxGrowAfterNoExpand,
      maxShrinkBeforeNoCollapse,
      maxShrinkAfterNoCollapse,
    })

    // delta > 0 means edge moved down/right (panelsBefore grows, panelsAfter shrinks)
    if (delta > 0) {
      let minDelta = Math.max(delta, expandedSpace, collapsedSpace)

      let clampedGrow, clampedShrink
      {
        clampedGrow = Math.min(minDelta, maxGrowBeforeNoExpand + expandedSpace)
        // Try to expand collapsed panels in panelsBefore if they need to grow
        const remaining = Math.abs(minDelta - clampedGrow)
        if (remaining > 0 && tryExpandPanel(panelsBefore, remaining)) {
          // Continue loop to recalculate clamped with expanded panel
          continue
        }
      }
      {
        clampedShrink = Math.min(minDelta, maxShrinkAfterNoCollapse + collapsedSpace)
        // Try to collapse collapsible panels in panelsAfter if space is still needed
        const remaining = Math.abs(minDelta - clampedShrink)
        if (remaining > 0 && tryCollapsePanel(panelsAfter, remaining)) {
          // Continue loop to recalculate clamped with new space
          continue
        }
      }
      clamped = Math.min(clampedGrow, clampedShrink)

      console.debug("[Resizable] Clamped:", {
        delta,
        minDelta,
        clamped,
        clampedGrow,
        clampedShrink,
      })
    }

    // delta < 0 means edge moved left/top (panelsBefore shrinks, panelsAfter grows)
    if (delta < 0) {
      let minDelta = Math.min(delta, -expandedSpace, -collapsedSpace)

      let clampedGrow, clampedShrink
      {
        clampedGrow = Math.max(minDelta, -(maxGrowAfterNoExpand + expandedSpace))
        // Try to expand collapsed panels in panelsAfter if they need to grow
        const remaining = Math.abs(minDelta - clampedGrow)
        if (remaining > 0 && tryExpandPanel(panelsAfter, remaining)) {
          // Continue loop to recalculate clamped with expanded panel
          continue
        }
      }
      {
        clampedShrink = Math.max(minDelta, -(maxShrinkBeforeNoCollapse + collapsedSpace))
        // Try to collapse collapsible panels in panelsBefore if space is still needed
        const remaining = Math.abs(minDelta - clampedShrink)
        if (remaining > 0 && tryCollapsePanel(panelsBefore, remaining)) {
          // Continue loop to recalculate clamped with new space
          continue
        }
      }
      clamped = Math.max(clampedGrow, clampedShrink)

      console.debug("[Resizable] Clamped:", {
        delta,
        minDelta,
        clamped,
        clampedGrow,
        clampedShrink,
      })
    }
    break
  }

  // Distribute space sequentially from the resize handle
  const amount = Math.abs(clamped)
  if (clamped > 0) {
    growSequentially(panelsBefore, amount - expandedSpace)
    shrinkSequentially(panelsAfter, amount - collapsedSpace)
  }
  if (clamped < 0) {
    growSequentially(panelsAfter, amount - expandedSpace)
    shrinkSequentially(panelsBefore, amount - collapsedSpace)
  }

  // Update maximized state
  const nonCollapsed = panels.filter((p) => !p.isCollapsed)
  if (nonCollapsed.length === 1) {
    group.prevMaximize = panels.map((p) => [p.prevCollapsed, p.prevSize])
    const panel = nonCollapsed[0]
    panel.isMaximized = true
  } else if (nonCollapsed.length > 1) {
    for (const panel of nonCollapsed) {
      panel.isMaximized = false
      group.prevMaximize = undefined
    }
  }

  // Check and shrink excess size if total exceeds container
  const currTotalSize = panels.reduce((sum, panel) => sum + panel.size, 0)
  let diff = currTotalSize - prevTotalSize
  console.assert(diff === 0, `[Resizable] Group size changed while resizing: ${diff}`)

  console.debug("[Resizable] MouseMove:", {
    delta,
    clamped,
    amount,
    collapsedSpace,
    expandedSpace,
    prevTotalSize,
    currTotalSize,
    diff,
    group,
    nonCollapsed,
  })

  // Trigger re-render for all affected panels
  for (const panel of panels) {
    panel.setDirty()
  }
}

export function ResizableContext({
  id: idProp,
  children,
  className = undefined,
  onLayoutChanged,
}: ResizableContextProps) {
  const id = idProp ?? useId()

  const ref = useRef<ContextValue>({
    id,
    groups: new Map<string, GroupValue>(),
    registerGroup: (group: GroupValue) => {
      ref.groups.set(group.id, group)
      console.debug("[ResizableContext] Register group:", group.id, "Groups:", Array.from(ref.groups.keys()))
    },
    unregisterGroup: (groupId: string) => {
      ref.groups.delete(groupId)
      console.debug("[ResizableContext] Unregister group:", groupId, "Groups:", Array.from(ref.groups.keys()))
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
          for (const panel of group.panels.values()) {
            panel.prevCollapsed = panel.isCollapsed
            // prevSize saves panel size before collapse, do not overwrite it
            if (!panel.isCollapsed) {
              panel.prevSize = panel.size
            }
          }
          group.isDragging = true
        }

        console.debug("[Resizable] MouseDown", {
          startPos: ref.startPos,
          dragIndex: ref.dragIndex,
        })
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.isDragging) {
        const edges = findEdgeIndexAtPoint(ref.groups, {
          x: e.clientX,
          y: e.clientY,
        })

        // Update cursor
        switch (edges.size) {
          case 0:
            // No edge: show default
            document.body.style.cursor = ""
            break
          case 1:
            const direction = edges.keys().next().value!
            // Single edge: show bidirectional arrow
            document.body.style.cursor = direction === "row" ? "ns-resize" : "ew-resize"
            break
          case 2:
            // Two edges (intersection): show crosshair
            document.body.style.cursor = "move"
            break
        }

        // Update hover state
        for (const [group, index] of ref.hoverIndex.values()) {
          const handle = group.handles.at(index)
          if (handle) {
            handle.isHover = false
            handle.setDirty()
          }
        }
        ref.hoverIndex = edges
        for (const [group, index] of ref.hoverIndex.values()) {
          const handle = group.handles.at(index)
          if (handle) {
            handle.isHover = true
            handle.setDirty()
          }
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

        adjustPanelByDelta(panelsBefore, panelsAfter, delta, group)
      }
    }

    const handleMouseUp = (_: MouseEvent) => {
      if (!ref.isDragging) {
        return
      }

      // Update panel size, in case group size changed while resizing
      for (const [group] of ref.dragIndex.values()) {
        for (const panel of group.panels.values()) {
          const el = panel.containerEl.current!
          const isCol = group.direction === "col"
          panel.size = isCol ? el.clientWidth : el.clientHeight
        }
        group.isDragging = false
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

    const handleDoubleClick = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      }, true)

      for (const [group, index] of edges.values()) {
        const handle = group.handles.at(index)
        if (handle && handle.onDoubleClick) {
          handle.onDoubleClick()
        }
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("dblclick", handleDoubleClick)

    console.debug("[Resizable] useEffect ContextValue:", ref)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("dblclick", handleDoubleClick)
    }
  }, [])

  return (
    <ResizableContextType.Provider value={ref}>
      <div
        data-resizable-context={id}
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
