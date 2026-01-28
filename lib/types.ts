import { ReactNode, RefObject } from "react"

export type Orientation = "horizontal" | "vertical"

export type ContextId = string
export type GroupId = string
export type PanelId = string

export interface ContextValue {
  // Unique Identifier
  id: ContextId
  // Groups in the Context
  groups: Map<GroupId, GroupValue>
  // Register Group
  registerGroup: (group: GroupValue) => void
  // Unregister Group
  unregisterGroup: (id: GroupId) => void
  // Get Group
  getGroup: (id: GroupId) => GroupValue
  // Call when Dragging
  onLayoutChange?: (sizes: Record<GroupId, number>) => void
  // Call when Mouse Released
  onLayoutChanged?: (sizes: Record<GroupId, number>) => void
}

export interface PanelValue {
  // Unique Identifier
  id: PanelId
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
  id: GroupId
  // Orientation of the Resizable Group
  orientation: Orientation
  // Panels in the Group
  panels: Map<PanelId, PanelValue>
  // Ref of the ResizableGroup Element
  container: RefObject<HTMLElement>
  // Register Panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (id: PanelId) => void
  // Set Collapse State
  setCollapse: (id: PanelId, collapse: boolean) => void
  // Set Maximize State
  setMaximize: (id?: PanelId) => void
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
