"use client"

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef } from "react"
import type {
  ContextProps,
  ContextValue,
  GroupValue,
  PanelValue,
  SavedGroupState,
  SavedPanelState
} from "./types"
import { useDebounce } from "./utils"

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
 * The margin from window edges to exclude from mouse hover style (px)
 * Prevents conflict with window resize handles.
 */
export const WINDOW_EDGE_MARGIN = 8

/**
 * Finds the edges near a given point within all resizable groups.
 *
 * @param groups - Map of group IDs to GroupValue objects
 * @param point - The point coordinates {x, y} to check (viewport coordinates)
 * @returns tuples of [GroupValue, handleIndex].
 *          Handle index i represents the boundary between panel[i] and panel[i+1].
 */
export function findEdgeIndexAtPoint(
  groups: Map<string, GroupValue>,
  point: { x: number; y: number },
): [GroupValue, number][] {
  let result: [GroupValue, number][] = []

  for (const group of groups.values()) {
    const margin = HANDLE_SIZE / 2
    const rect = group.containerEl.current!.getBoundingClientRect()

    // Skip if parent collapsed
    if (group.parent?.isCollapsed) continue

    // Skip if point is not within group bounds (with margin)
    if (
      point.x < rect.x - margin ||
      point.x > rect.right + margin ||
      point.y < rect.top - margin ||
      point.y > rect.bottom + margin
    ) {
      continue
    }

    const panels = [...group.panels.values()]

    if (group.direction === "row") {
      // Calculate edge positions along y-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        // If both collapsed, then the handle is hidden
        if (panels[i].isCollapsed && panels[i + 1].isCollapsed) continue
        // Check if point at the edge
        const el = panels[i].containerEl.current!
        const rect = el.getBoundingClientRect()
        const edgeY = rect.bottom
        if (Math.abs(point.y - edgeY) <= margin) {
          result = [...result, [group, i]]
          break
        }
      }
    } else {
      // Calculate edge positions along x-axis using actual DOM rects
      for (let i = 0; i < panels.length - 1; i++) {
        // If both collapsed, then the handle is hidden
        if (panels[i].isCollapsed && panels[i + 1].isCollapsed) continue
        // Check if point at the edge
        const el = panels[i].containerEl.current!
        const rect = el.getBoundingClientRect()
        const edgeX = rect.right
        if (Math.abs(point.x - edgeX) <= margin) {
          result = [...result, [group, i]]
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
 * @param group - The group containing these panels, used for updating maximized state. Must have prevDrag initialized
 */
export function adjustPanelByDelta(
  panelsBefore: PanelValue[],
  panelsAfter: PanelValue[],
  delta: number,
  group: GroupValue,
): void {
  console.debug("[Resizable] Panels:", {
    panelsBefore,
    panelsAfter,
  })

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
      console.debug("[Resizable] Collapsed Panel:", { panel: nextPanel.id, remaining })
      return true
    }
    return false
  }

  // Try to expand a collapsed panel from the given panels if there's enough space
  const tryExpandPanel = (panels: PanelValue[], remaining: number): boolean => {
    const nextPanel = panels.find((p) => p.isCollapsed)
    if (nextPanel && remaining > nextPanel.minSize / 2) {
      expandedSpace += nextPanel.minSize
      nextPanel.isCollapsed = false
      nextPanel.size = nextPanel.minSize
      console.debug("[Resizable] Expanded Panel:", { panel: nextPanel.id, remaining })
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

  // Check and shrink excess size if total exceeds container
  const currTotalSize = panels.reduce((sum, panel) => sum + panel.size, 0)
  let diff = currTotalSize - prevTotalSize
  console.assert(diff === 0, `[Resizable] Group size changed while resizing: ${diff}`)

  // Update maximized state
  group.isMaximized = false
  panels.forEach((p) => (p.isMaximized = false))
  const nonCollapsed = panels.filter((p) => !p.isCollapsed)
  if (nonCollapsed.length === 1) {
    const panel = nonCollapsed[0]
    if (panel.okMaximize) {
      panel.isMaximized = true
      panel.prevMaximize = panel.prevDrag
      group.isMaximized = true
    }
  }

  console.debug("[Resizable] Adjusted:", {
    group: group.id,
    delta,
    clamped,
    amount,
    collapsedSpace,
    expandedSpace,
    diff,
    prevTotalSize,
    currTotalSize,
    nonCollapsed: nonCollapsed.map((p) => p.id),
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
  onContextMount,
  onStateChanged,
}: ContextProps) {
  const id = idProp ?? useId()

  // Store subscribers
  const subscribers = useRef<Set<(context: ContextValue) => void>>(new Set())
  const contextRef = useRef<ContextValue | null>(null)

  const notify = useCallback(
    useDebounce(() => {
      subscribers.current.forEach((cb) => cb(contextRef.current!))
    }),
    [],
  )

  const subscribe = useCallback((callback: (context: ContextValue) => void) => {
    subscribers.current.add(callback)
    return () => subscribers.current.delete(callback)
  }, [])

  const ref = useRef<ContextValue>({
    id,
    groups: new Map<string, GroupValue>(),
    registerGroup: (group: GroupValue) => {
      ref.groups.set(group.id, group)
      console.debug(`[Context] Register (${group.id}) => [${[...ref.groups.keys()]}]`)
    },
    subscribe,
    notify,
    getState: () => {
      const state: Record<string, SavedGroupState> = {}
      for (const [groupId, group] of ref.groups) {
        const panels: Record<string, SavedPanelState> = {}
        const panelEntries = [...group.panels.entries()]
        for (let i = 0; i < panelEntries.length; i++) {
          const [panelId, p] = panelEntries[i]
          panels[panelId] = {
            id: p.id,
            size: p.size,
            openSize: p.openSize,
            isCollapsed: p.isCollapsed,
            isMaximized: p.isMaximized,
            prevMaximize: p.prevMaximize,
          }
        }
        state[groupId] = { isMaximized: group.isMaximized, panels }
      }
      return state
    },
    setState: (layout: Record<string, SavedGroupState> | null) => {
      if (!layout) return
      for (const [groupId, groupData] of Object.entries(layout)) {
        const group = ref.groups.get(groupId)
        if (!group) continue

        const panels = [...group.panels.values()]
        const { panels: savedPanels } = groupData

        group.isMaximized = groupData.isMaximized

        // Apply panel states (match by panel id)
        for (const panel of panels) {
          const saved = savedPanels[panel.id]

          console.assert(saved !== undefined, "[Context] Skipping panel", { id: panel.id, savedPanels })
          if (!saved) continue

          panel.size = saved.size
          panel.openSize = saved.openSize
          panel.isCollapsed = saved.isCollapsed
          panel.isMaximized = saved.isMaximized
          panel.prevMaximize = saved.prevMaximize
        }

        // Trigger re-render for all panels
        for (const panel of panels) {
          panel.setDirty()
        }
      }
      console.debug("[Context] Layout applied:", layout)
    },
    isDragging: false,
    hasDragged: false,
    movePos: { x: 0, y: 0 },
    downPos: { x: 0, y: 0 },
    dragIndex: [],
    hoverIndex: [],
    updateHoverState: () => {
      if (ref.isDragging) return

      const handles = findEdgeIndexAtPoint(ref.groups, ref.movePos)

      // Update hover state
      for (const [group, index] of ref.hoverIndex) {
        const handle = group.handles.at(index)
        if (handle) {
          handle.isHover = false
          handle.setDirty()
        }
      }
      ref.hoverIndex = handles
      for (const [group, index] of ref.hoverIndex) {
        const handle = group.handles.at(index)
        if (handle) {
          handle.isHover = true
          handle.setDirty()
        }
      }

      // Skip if point is too close to window edges (to avoid conflict with window resize)
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      if (
        ref.movePos.x < WINDOW_EDGE_MARGIN ||
        ref.movePos.x > windowWidth - WINDOW_EDGE_MARGIN ||
        ref.movePos.y < WINDOW_EDGE_MARGIN ||
        ref.movePos.y > windowHeight - WINDOW_EDGE_MARGIN
      ) {
        return
      }

      // Update cursor
      switch (handles.length) {
        case 0:
          // No edge: show default
          document.body.style.cursor = ""
          break
        case 1:
          const item = handles[0]
          // Single edge: show bidirectional arrow
          document.body.style.cursor = item[0].direction === "row" ? "ns-resize" : "ew-resize"
          break
        case 2:
          // Two edges (intersection): show crosshair
          document.body.style.cursor = "move"
          break
      }
    },
  }).current

  contextRef.current = ref

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      ref.downPos = { x: e.clientX, y: e.clientY }

      const handles = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      })
      if (handles.length) {
        ref.dragIndex = handles
        ref.isDragging = true
        ref.hasDragged = false

        // Save Initial State
        for (const [group] of ref.dragIndex.values()) {
          ;[...group.panels.values()].forEach((p) => (p.prevDrag = [p.isCollapsed, p.size]))
        }

        console.debug("[Context] DragStart", {
          startPos: ref.downPos,
          dragIndex: [...handles.entries()].map(([direction, [group, index]]) => ({
            direction,
            groupId: group.id,
            index,
          })),
        })
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      ref.movePos = { x: e.clientX, y: e.clientY }
      ref.updateHoverState()

      if (!ref.isDragging) {
        return
      }

      ref.hasDragged = true

      const deltaX = e.clientX - ref.downPos.x
      const deltaY = e.clientY - ref.downPos.y

      for (const [group, index] of ref.dragIndex.values()) {
        const panels = [...group.panels.values()]
        const panelsBefore = panels.slice(0, index + 1).reverse()
        const panelsAfter = panels.slice(index + 1)

        // Get delta based on direction
        const delta = group.direction === "row" ? deltaY : deltaX

        // Restore initial states
        for (let i = 0; i < panels.length; i++) {
          const panel = panels[i]
          panel.isCollapsed = panel.prevDrag[0]
          panel.size = panel.prevDrag[1]
        }

        adjustPanelByDelta(panelsBefore, panelsAfter, delta, group)
      }
    }

    const handleMouseUp = (_: MouseEvent) => {
      if (!ref.isDragging) {
        return
      }
      console.debug("[Context] DragEnd")

      // Reset drag state
      ref.isDragging = false
      ref.dragIndex = []
    }

    let deferredClick: ReturnType<typeof setTimeout> | null = null

    const handleClick = (e: MouseEvent) => {
      const edges = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      })

      // Clear any existing timer
      if (deferredClick) {
        clearTimeout(deferredClick)
      }

      // Delay click execution to wait for potential double click
      deferredClick = setTimeout(() => {
        for (const [group, index] of edges.values()) {
          if (ref.hasDragged) return
          // Emit click event
          const handle = group.handles.at(index)
          if (handle && handle.onClick) {
            handle.onClick()
          }
        }
        deferredClick = null
      }, 250)
    }

    const handleDoubleClick = (e: MouseEvent) => {
      // Cancel pending click if double click occurs
      if (deferredClick) {
        clearTimeout(deferredClick)
        deferredClick = null
      }

      const handles = findEdgeIndexAtPoint(ref.groups, {
        x: e.clientX,
        y: e.clientY,
      })

      for (const [group, index] of handles.values()) {
        const handle = group.handles.at(index)
        if (handle && handle.onDoubleClick) {
          handle.onDoubleClick()
        }
      }
    }

    const handleMouseLeave = (_: MouseEvent) => {
      if (ref.isDragging) return
      // Update hover state
      for (const [group, index] of ref.hoverIndex.values()) {
        const handle = group.handles.at(index)
        if (handle) {
          handle.isHover = false
          handle.setDirty()
        }
      }
      ref.hoverIndex = []
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClick)
    document.addEventListener("dblclick", handleDoubleClick)

    console.debug("[Context] ContextValue:", ref)

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("dblclick", handleDoubleClick)
    }
  }, [])

  // Update hover state after layout changed
  useEffect(() => {
    const unsubscribe = subscribe((context) => {
      context.updateHoverState()
    })
    return () => {
      unsubscribe()
    }
  }, [])

  useLayoutEffect(() => {
    if (!onContextMount) return
    onContextMount(ref)
  }, [])

  let debounced = onStateChanged ? useDebounce(onStateChanged, 250) : null
  useEffect(() => {
    if (!debounced) return () => {}
    return subscribe(debounced)
  }, [debounced])

  return (
    <ResizableContextType.Provider value={ref}>
      <div
        data-resizable-context={ref.id}
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
