import { ReactNode } from "react"

export type Orientation = "horizontal" | "vertical"

export interface PanelData {
  // Unique Identifier
  id: string
  // Active Size (px)
  size: number
  // Minimum Size (px)
  minSize: number
  // Default Size (px)
  defaultSize: number
  // Size before Collapse (px)
  openSize: number
  // Allow Collapse?
  collapsible: boolean
  // Is Collapsed?
  isCollapsed: boolean
  // Allow Maximize?
  okMaximize: boolean
  // Is Maximized?
  isMaximized: boolean
}

export interface ResizableGroupContextValue {
  // Unique Identifier
  id: string
  // Orientation of the Resizable Group
  orientation: Orientation
  // Panels in the Group
  panels: Map<string, PanelData>
  // Register Panel
  registerPanel: (id: string, panel: PanelData) => void
  // Unregister Panel
  unregisterPanel: (id: string) => void
  // Get Panel Size (px)
  getPanelSize: (id: string) => number
  // Update Panel Size (px)
  updatePanelSize: (id: string, size: number) => void
  // Set Collapse State
  setCollapse: (id: string, collapse: boolean) => void
  // Set Maximize State
  setMaximize: (id: string, maximize: boolean) => void
  // Start Dragging (handleIndex) - internal use
  startDragging: (handleIndex: number) => void
  // Update Drag Position (pointerPosition in px) - internal use
  updateDrag: (pointerPosition: number) => void
  // Set Drag Start Pointer Position - internal use
  setDragStartPointer: (pointerPosition: number) => void
  // Stop Dragging - internal use
  stopDragging: () => void
  // Is Currently Dragging?
  isDragging: boolean
  // Current Drag Handle Index
  dragHandleIndex: number
  // Currently Maximized Panel ID
  maximizedPanel?: string
  // Register callback for size changes
  registerSizeChangeCallback: (callback: () => void) => () => void
  // Register Handle (index, beforePanelId, afterPanelId)
  registerHandle: (index: number, beforePanelId: string, afterPanelId: string) => void
  // Update Handle Positions (recalculate handle positions based on current panel sizes)
  updateHandlePositions: () => void
  // Find Handle at Position (pointerPosition in px, returns handle index or -1)
  findHandleAtPosition: (pointerPosition: number) => number
  // Get Handle Panels (returns before and after panel ids for a handle)
  getHandlePanels: (handleIndex: number) => { before: string | null; after: string | null }
  // Currently Hovered Handle Index (-1 if none)
  hoveredHandleIndex: number
  // Set Hovered Handle Index
  setHoveredHandle: (index: number) => void
}

export interface ResizableGroupProps {
  // Unique Identifier
  id: string
  // Orientation of the Group
  orientation: Orientation
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
  // Call when Dragging
  onLayoutChange?: (sizes: Record<string, number>) => void
  // Call when Mouse Released
  onLayoutChanged?: (sizes: Record<string, number>) => void
}

export interface ResizablePanelProps {
  // Unique Identifier
  id: string
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
  // Minimum Size (px)
  minSize?: number
  // Default Size (px)
  defaultSize?: number
  // Allow Collapse?
  collapsible?: boolean
  // Allow Maximize?
  okMaximize?: boolean
}

export interface ResizableHandleProps {
  // CSS Class Name
  className?: string
}
