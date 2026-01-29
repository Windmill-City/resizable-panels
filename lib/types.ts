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
  // Layout Changed
  onLayoutChanged?: (context: ContextValue) => void
  // Is Dragging Panels?
  isDragging: boolean
  // Mouse Previous Pos
  prevPos: { x: number; y: number }
  // Index of the resize handle (edge) being dragged
  // For panels [P0, P1], edges are indexed as:
  //    V - Edge Index: 0 (drag handle between P0 and P1)
  // |P0|P1|
  //    0  1   (edge positions)
  dragIndex: Map<Orientation, [GroupValue, number]>
  // Index of the resize handle (edge) being hover
  hoverIndex: Map<Orientation, [GroupValue, number]>
}

export interface PanelValue {
  // Unique Identifier
  id: string
  // Active Size (px)
  size: number
  // Size before Collapse/Resize (px)
  prevSize: number
  // Keep Active Size when Group Size Change?
  keepSize: boolean
  // Minimum Size (px)
  minSize: number
  // Default Size (px)
  defaultSize: number
  // Allow Collapse?
  collapsible: boolean
  // Is Collapsed?
  isCollapsed: boolean
  // Is Collapsed before Resize?
  prevCollapsed: boolean
  // Allow Maximize?
  okMaximize: boolean
  // Is Maximized?
  isMaximized: boolean
  // Ref of the ResizablePanel Element
  container: RefObject<HTMLElement>
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
  // Set Maximize Panel
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
    // Layout Changed
  onLayoutChanged?: (context: ContextValue) => void
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
  // Keep Active Size when Group Size Change?
  keepSize?: boolean
  // Minimum Size (px)
  minSize?: number
  // Default Size (px)
  defaultSize?: number
  // Allow Collapse?
  collapsible?: boolean
  // Allow Maximize?
  okMaximize?: boolean
}
