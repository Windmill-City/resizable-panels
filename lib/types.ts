import { ReactNode, RefObject } from "react"

export type Orientation = "horizontal" | "vertical"

export enum LayoutEvent {
  Pre = "pre",
  OnGoing = "ongoing",
  Post = "post",
}

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
  // Layout event handler
  onLayoutEvent?: (context: ContextValue, phase: LayoutEvent) => void
  // Is Dragging Panels?
  isDragging: boolean
  // MouseDown Pos
  startPos: { x: number; y: number }
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
  // Minimum Size (px)
  minSize: number
  // Default Size (px)
  defaultSize: number
  // Size before Collapse/Resizing (px)
  prevSize: number
  // Collapsed beforeResizing
  prevCollapsed: boolean
  // Allow Collapse?
  collapsible: boolean
  // Is Collapsed?
  isCollapsed: boolean
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
