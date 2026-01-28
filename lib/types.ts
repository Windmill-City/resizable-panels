import { ReactNode, RefObject } from "react"

export type Orientation = "horizontal" | "vertical"


export interface ContextValue {
  // Unique Identifier
  id: string
  // Groups in the Context
  groups: Map<string, GroupValue>
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
  // Ref of the ResizableGroup Element
  container: RefObject<HTMLElement>
  // Register Panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (id: string) => void
  // Set Collapse State
  setCollapse: (id: string, collapse: boolean) => void
  // Set Maximize State
  setMaximize: (id?: string) => void
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
