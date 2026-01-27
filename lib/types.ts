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
  // Start Dragging
  startDragging: (handleIndex: number) => void
  // Stop Dragging
  stopDragging: () => void
  // Is Currently Dragging?
  isDragging: boolean
  // Current Drag Handle Index
  dragHandleIndex: number
  // Currently Maximized Panel ID
  maximizedPanel?: string
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
