import { GroupValue, useGroupContext } from "@local/resizable-panels"
import { clsx, type ClassValue } from "clsx"
import { useMemo } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Toggle panel collapsed state
 */
export function toggleCollapse(panelId: string, group: GroupValue) {
  if (!group.restorePanels())
    switch (panelId) {
      case "left":
        {
          const panel = group.panels.get("left")!
          if (panel.isCollapsed) {
            // Open if collapsed
            group.dragHandle(panel.openSize, 0)
          } else {
            // Collapse if open
            group.dragHandle(-panel.size, 0)
          }
        }
        break
      case "right":
        {
          const panel = group.panels.get("right")!
          if (panel.isCollapsed) {
            // Open if collapsed
            group.dragHandle(-panel.openSize, 1)
          } else {
            // Collapse if open
            group.dragHandle(panel.size, 1)
          }
        }
        break
      case "bottom":
        {
          const panel = group.panels.get("bottom")!
          if (panel.isCollapsed) {
            // Open if collapsed
            group.dragHandle(-panel.openSize, 0)
          } else {
            // Collapse if open
            group.dragHandle(panel.size, 0)
          }
        }
        break
    }
}

/**
 * Hook for panel control logic
 * @param panelId - Id of the target panel to control
 * @returns Click and double-click handlers
 */
export function usePanelControl(panelId: string) {
  const group = useGroupContext()

  const handleClick = () => {
    console.debug("[App] handleClick")

    // Click to restore when maximized
    if (group.prevMaximize) {
      group.restorePanels()
      return
    }

    toggleCollapse(panelId, group)
  }

  const handleDoubleClick = () => {
    console.debug("[App] handleDoubleClick")

    // Double-click to restore when maximized
    if (group.prevMaximize) {
      group.restorePanels()
      return
    }

    const target = group.panels.get(panelId)!

    // Double-click to expand when collapsed
    if (target.isCollapsed) {
      toggleCollapse(panelId, group)
      return
    }

    // Double-click to maximize when expanded
    group.maximizePanel(target.id)
  }

  return { handleClick, handleDoubleClick }
}

/**
 * Hook to debounce a callback function
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  return useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }, [fn, delay])
}
