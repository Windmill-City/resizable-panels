import { ReactNode } from "react"

export type Orientation = "horizontal" | "vertical"

export interface ContextValue {
  // Unique Identifier
  id: string
  // Groups in the Context
  groups: Map<string, GroupValue>
  // Ref of the ResizableContext Element
  container: React.RefObject<HTMLElement>
  // Register Group
  registerGroup: (group: GroupValue) => void
  // Unregister Group
  unregisterGroup: (id: string) => void
  // Get Group
  getGroup: (id: string) => GroupValue
  // Call when Dragging
  onLayoutChange?: (sizes: Record<string, number>) => void
  // Call when Mouse Released
  onLayoutChanged?: (sizes: Record<string, number>) => void
}

export interface PanelValue {
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
  // Trigger Re-render
  setDirty: () => void
}

export interface GroupValue {
  // Unique Identifier
  id: string
  // Orientation of the Resizable Group
  orientation: Orientation
  // Panels in the Group
  panels: Map<string, PanelValue>
  // Register Panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (panelId: string) => void
  // Set Collapse State
  setCollapse: (panelId: string, collapse: boolean) => void
  // Set Maximize State
  setMaximize: (panelId?: string) => void
  // Is Dragging?
  isDragging: boolean
  // Resizing Handle Index
  //    V - Index: 1
  // |P0|P1| - panels: Map<string, PanelValue>
  // 0  1  2
  dragIndex: number
  // Maximized Panel
  maximizedPanel?: PanelValue
}

export interface ResizableContextProps {
  // Unique Identifier
  id?: string
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
}

export interface ResizableGroupProps {
  // Unique Identifier
  id?: string
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
  // Orientation of the Group
  orientation?: Orientation
}

export interface ResizablePanelProps {
  // Unique Identifier
  id?: string
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
