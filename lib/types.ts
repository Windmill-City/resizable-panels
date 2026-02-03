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
  // Layout Mount - Load saved data
  onLayoutMount?: (context: ContextValue) => void
  // Layout Changed - Save changed layout
  onLayoutChanged?: (context: ContextValue) => void
  // Subscribe to layout changes
  subscribe: (callback: (context: ContextValue) => void) => () => void
  // Notify all subscribers
  notify: () => void
  // Save current layout to Record object
  saveLayout: () => Record<string, SavedGroupLayout>
  // Load layout from JSON string
  loadLayout: (json: string | null) => Record<string, SavedGroupLayout> | null
  // Apply loaded layout to groups
  applyLayout: (layout: Record<string, SavedGroupLayout> | null) => void
  // Is Dragging Panels?
  isDragging: boolean
  // hasDragged?
  hasDragged: boolean
  // Previous Mouse Pos
  prevPos: { x: number; y: number }
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
  // Update hover state based on mouse point
  updateHoverState: (point: { x: number; y: number }) => void
}

export interface GroupValue {
  // Unique Identifier
  id: string
  // Direction of the Resizable Group
  direction: Direction
  // Use ratio mode for flex layout?
  ratio: boolean
  // Panels in the Group
  panels: Map<string, PanelValue>
  // Handles in the Group
  handles: HandleValue[]
  // Ref of the ResizableGroup Element
  containerEl: RefObject<HTMLElement>
  // content size of containerEl
  size: number
  // State before Drag - [isCollapsed, size]
  prevDrag?: [boolean, number][]
  // State before Maximize - [isCollapsed, size]
  prevMaximize?: [boolean, number][]
  // Register Panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (id: string) => void
  // Register Handle
  registerHandle: (handle: HandleValue) => void
  // Unregister Handle
  unregisterHandle: (id: string) => void
  // Drag panel by delta at given handle index
  // delta < 0, drag left/top, delta > 0 drag right/bottom
  dragHandle: (delta: number, index: number) => void
  // Restore all panels to their previous state before maximization
  // retrun if restored
  restorePanels: () => boolean
  // Maximize a specific panel by collapsing all others
  // retrun if maximized
  maximizePanel: (targetId: string) => boolean
  // Toggle maximize/restore panel
  toggleMaximize: (targetId: string) => void
  // Called when group container size changes (or may have changed)
  onContainerResize: () => void
}

export interface SavedGroupLayout {
  // Panels in the group (keyed by panel id)
  panels: Record<string, SavedPanelLayout>
}

export interface PanelValue {
  // Unique Identifier
  id: string
  // Active Size (px)
  size: number
  // Size before Collapse (px)
  openSize: number
  // Grow/Shirk when Group Size Change?
  expand?: boolean
  // Minimum Size (px)
  minSize: number
  // Maximum Size (px)
  maxSize: number
  // Allow Collapse?
  collapsible: boolean
  // Is Collapsed?
  isCollapsed: boolean
  // Allow Maximize?
  okMaximize: boolean
  // Is Maximized?
  isMaximized: boolean
  // Ref of the ResizablePanel Element
  containerEl: RefObject<HTMLElement>
  // Trigger Re-render
  setDirty: () => void
}

export interface SavedPanelLayout {
  // Unique Identifier
  id: string
  // Active Size (px)
  size: number
  // Size before Collapse (px)
  openSize: number
  // Is panel collapsed
  isCollapsed: boolean
  // Is panel maximized
  isMaximized: boolean
  // State before maximize - [isCollapsed, size]
  prevMaximize?: [boolean, number]
}

export interface HandleValue {
  // Unique Identifier
  id: string
  // Is Mouse Hovered
  isHover: boolean
  // Trigger Re-render
  setDirty: () => void
  // Click callback
  onClick?: () => void
  // Double click callback
  onDoubleClick?: () => void
}

export interface ResizableContextProps {
  // Unique Identifier
  id?: string
  // Child Elements
  children?: ReactNode
  // CSS Class Name
  className?: string
  // Layout Mount - Load saved data
  onLayoutMount?: (context: ContextValue) => void
  // Layout Changed - Save changed layout
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
  // Use ratio mode for flex layout?
  // When true, panel flex becomes: `${size} ${size} 0%`
  ratio?: boolean
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
  // Initial Collapsed State?
  collapsed?: boolean
  // Allow Maximize?
  okMaximize?: boolean
}

export interface ResizableHandleProps {
  // CSS Class Name
  className?: string
  // Custom content like drag icons
  children?: ReactNode
  // Click callback
  onClick?: () => void
  // Double click callback
  onDoubleClick?: () => void
}
