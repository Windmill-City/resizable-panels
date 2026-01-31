import { ReactNode, RefObject } from "react"

export type Direction = "row" | "col"

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
  // Drag Start Pos
  startPos: { x: number; y: number }
  // Index of the resize handle (edge) being dragged
  // For panels [P0, P1], edges are indexed as:
  //    V - Edge Index: 0 (drag handle between P0 and P1)
  // |P0|P1|
  //    0  1   (edge positions)
  dragIndex: Map<Direction, [GroupValue, number]>
  // Index of the resize handle (edge) being hover
  hoverIndex: Map<Direction, [GroupValue, number]>
}

export interface PanelValue {
  // Unique Identifier
  id: string
  // Active Size (px)
  size: number
  // Size before Collapse/Resize/Maximize (px)
  prevSize: number
  // Grow/Shirk when Group Size Change?
  expand?: boolean
  // Minimum Size (px)
  minSize: number
  // Maximum Size (px)
  maxSize: number
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
  containerEl: RefObject<HTMLElement>
  // Trigger Re-render
  setDirty: () => void
}

export interface GroupValue {
  // Unique Identifier
  id: string
  // Direction of the Resizable Group
  direction: Direction
  // Panels in the Group
  panels: Map<string, PanelValue>
  // Ref of the ResizableGroup Element
  containerEl: RefObject<HTMLElement>
  // Register Panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (id: string) => void
  // Set Collapse State, returns true if successful
  setCollapse: (id: string, collapse: boolean) => boolean
  // Set Maximize Panel, returns true if successful
  setMaximize: (id?: string) => boolean
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
  // Direction of the Group
  direction?: Direction
}

export interface ResizablePanelProps {
  // Unique Identifier
  id?: string
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
  // Grow/Shirk when Group Size Change?
  expand?: boolean
  // Minimum Size (px)
  minSize?: number
  // Maximum Size (px), undefined means no limit
  maxSize?: number
  // Default Size (px)
  defaultSize?: number
  // Allow Collapse?
  collapsible?: boolean
  // Allow Maximize?
  okMaximize?: boolean
}
