import { useMemo } from "react"
import { SavedGroupState, SavedPanelState } from "./types"

/**
 * Hook to debounce a callback function
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number = 0) {
  return useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }, [fn, delay])
}

export function fromJson(json: string | null) {
  if (!json) return null
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== "object" || parsed === null) {
      console.error("[Context] Invalid layout format: not an object")
      return null
    }
    for (const [groupId, groupData] of Object.entries(parsed)) {
      if (!isValidSavedGroupState(groupData)) {
        console.error(`[Context] Invalid layout format for group: ${groupId}`)
        return null
      }
    }
    return parsed as Record<string, SavedGroupState>
  } catch (e) {
    console.error("[Context] Failed to load layout:", e)
    return null
  }
}

/**
 * Validate if the loaded data matches SavedPanelLayout format
 */
function isValidSavedPanelState(data: unknown): data is SavedPanelState {
  if (typeof data !== "object" || data === null) return false
  const p = data as Record<string, unknown>
  return (
    typeof p.id === "string" &&
    typeof p.size === "number" &&
    typeof p.openSize === "number" &&
    typeof p.isCollapsed === "boolean" &&
    typeof p.isMaximized === "boolean" &&
    (p.prevMaximize === undefined ||
      (Array.isArray(p.prevMaximize) &&
        p.prevMaximize.length === 2 &&
        typeof p.prevMaximize[0] === "boolean" &&
        typeof p.prevMaximize[1] === "number"))
  )
}

/**
 * Validate if the loaded data matches SavedGroupLayout format
 */
function isValidSavedGroupState(data: unknown): data is SavedGroupState {
  if (typeof data !== "object" || data === null) return false
  const g = data as Record<string, unknown>
  if (typeof g.panels !== "object" || g.panels === null) return false
  for (const panel of Object.values(g.panels)) {
    if (!isValidSavedPanelState(panel)) return false
  }
  return true
}
