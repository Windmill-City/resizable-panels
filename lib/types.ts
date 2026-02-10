import { ReactNode, RefObject } from "react"

export type Direction = "row" | "col"

export type Point = {
  x: number
  y: number
}

export type SavedContextState = Record<string, SavedGroupState>

export interface ContextValue {
  // Unique identifier
  id: string
  // Groups in the context
  groups: Map<string, GroupValue>
  // Register group
  registerGroup: (group: GroupValue) => void
  // Unregister group
  unregisterGroup: (groupId: string) => void
  // Subscribe to layout changes
  subscribe: (callback: (context: ContextValue) => void) => () => void
  // Notify listeners on layout changes
  notify: () => void
  // get current context state
  getState: () => SavedContextState
  // Apply loaded state to groups
  setState: (state: SavedContextState | null) => void
  // When true the mouse is pressing handle(s)
  isDragging: boolean
  // When true the handle was moved by dragging, reset on next mouse down
  hasDragged: boolean
  // Latest mouse pos from mouse move event, undefined when mouseleave
  mousePos?: Point
  // Latest mouse pos from mouse down event
  downPos: Point
  // Index of the resize handle (edge) being dragged
  // For panels [P0, P1], edges are indexed as:
  //    V - Edge Index: 0 (drag handle between P0 and P1)
  // |P0|P1|
  //    0  1   (edge positions)
  dragIndex: [GroupValue, number][]
  // Index of the resize handle (edge) being hover
  hoverIndex: [GroupValue, number][]
  // Update hover state based on movePos
  updateHoverState: () => void
}

export interface GroupValue {
  // Unique identifier
  id: string
  // Direction of the resizable group
  direction: Direction
  // Use ratio mode for flex layout?
  ratio: boolean
  // Panels in the group
  panels: Map<string, PanelValue>
  // Handles in the group
  handles: HandleValue[]
  // Ref of the ResizableGroup element
  containerEl: RefObject<HTMLElement>
  // Is maximized?
  isMaximized: boolean
  // Register panel
  registerPanel: (panel: PanelValue) => void
  // Unregister Panel
  unregisterPanel: (id: string) => void
  // Register Handle
  registerHandle: (handle: HandleValue) => void
  // Unregister Handle
  unregisterHandle: (id: string) => void
  // Drag panel by delta at given handle index
  // Delta < 0, drag left/top, delta > 0 drag right/bottom
  dragHandle: (delta: number, index: number) => void
  // Restore all panels to their previous state before maximization
  // Return if restored
  restorePanels: () => boolean
  // Maximize a specific panel by collapsing all others
  // Return if maximized
  maximizePanel: (targetId: string) => boolean
  // Toggle maximize/restore panel
  toggleMaximize: (targetId: string) => void
}

export interface SavedGroupState {
  // Is maximized?
  isMaximized: boolean
  // Panels in the group (keyed by panel id)
  panels: Record<string, SavedPanelState>
}

export interface PanelValue {
  // Unique identifier
  id: string
  // Active size (px)
  size: number
  // Size before collapse (px)
  openSize: number
  // Default size (px)
  defaultSize: number
  // Grow/shirk when group size change?
  expand?: boolean
  // Minimum size (px)
  minSize: number
  // Maximum size (px)
  maxSize: number
  // Allow collapse?
  collapsible: boolean
  // Is collapsed?
  isCollapsed: boolean
  // Allow maximize?
  okMaximize: boolean
  // Is maximized?
  isMaximized: boolean
  // State before drag - [isCollapsed, size]
  prevDrag: [boolean, number]
  // State before maximize - [isCollapsed, size]
  prevMaximize: [boolean, number]
  // Ref of the ResizablePanel element
  containerEl: RefObject<HTMLElement>
  // Trigger Re-render
  setDirty: () => void
  // Update size from DOM
  updateSizeFromDOM: () => void
}

export interface SavedPanelState {
  // Unique identifier
  id: string
  // Active size (px)
  size: number
  // Size before collapse (px)
  openSize: number
  // Is panel collapsed
  isCollapsed: boolean
  // Is panel maximized
  isMaximized: boolean
  // State before maximize - [isCollapsed, size]
  prevMaximize: [boolean, number]
}

export interface HandleValue {
  // Unique identifier
  id: string
  // Is mouse hovered
  isHover: boolean
  // Trigger Re-render
  setDirty: () => void
  // Click callback
  onClick?: () => void
  // Double click callback
  onDoubleClick?: () => void
}

export interface ContextProps {
  // Unique identifier
  id?: string
  // Child elements
  children?: ReactNode
  // CSS class name
  className?: string
  // Context Mount - Load saved data
  onContextMount?: (context: ContextValue) => void
  // State Changed - Save changed state
  onStateChanged?: (context: ContextValue) => void
}

export interface GroupProps {
  // Unique identifier
  id?: string
  // Child elements
  children?: ReactNode
  // CSS class name
  className?: string
  // Direction of the group
  direction?: Direction
  // Use ratio mode for flex layout?
  // When true, panel flex becomes: `${size} ${size} 0%`
  ratio?: boolean
}

export interface PanelProps {
  // Unique identifier
  id?: string
  // Child elements
  children?: ReactNode
  // CSS class name
  className?: string
  // Grow/shirk when group size change?
  expand?: boolean
  // Minimum Size (px)
  minSize?: number
  // Maximum size (px), undefined means no limit
  maxSize?: number
  // Default size (px)
  defaultSize?: number
  // Allow collapse?
  collapsible?: boolean
  // Initial collapsed state?
  collapsed?: boolean
  // Allow maximize?
  okMaximize?: boolean
}

export interface HandleProps {
  // CSS class name
  className?: string
  // Custom content like drag icons
  children?: ReactNode
  // Click callback
  onClick?: () => void
  // Double click callback
  onDoubleClick?: () => void
}
