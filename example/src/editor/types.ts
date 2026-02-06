import { ReactNode } from "react"

/**
 * Represents a single file tab in the editor
 */
export interface Tab {
  id: string
  name: string
  language: string
  iconColor: string
  content: string[]
}

/**
 * Direction for splitting the editor view
 * - horizontal: Split side by side (left-right)
 * - vertical: Split top and bottom (up-down)
 */
export type SplitDirection = "horizontal" | "vertical"

/**
 * A group of tabs that share the same editor pane
 * Tracks the currently active tab within the group
 */
export interface EditorGroup {
  id: string
  tabs: Tab[]
  activeTabId: string
}

/**
 * A node in the split tree that represents a split container
 * Contains children that can be either nested SplitNodes or leaf data (EditorGroup)
 * The sizes array controls the relative sizes of children
 */
export interface SplitNode<T = EditorGroup> {
  id: string
  direction: SplitDirection
  children: (SplitNode<T> | T)[]
}

/**
 * Generic view node type - can be EditorGroup or any custom data
 * Used for flexible tree structures where leaf nodes hold data
 */
export interface ViewNode<T = unknown> {
  id: string
  data: T
  title?: string
}

/**
 * Generic split tree type - recursively defined as either a SplitNode or leaf data
 * Forms the complete tree structure for managing nested splits
 */
export type SplitTree<T> = SplitNode<T> | T

/**
 * Render function type for leaf nodes in the split tree
 * Provides callbacks for updating data, splitting, and closing the editor pane
 */
export type RenderLeafFn<T> = (props: {
  data: T
  onUpdate: (data: T) => void
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canClose: boolean
}) => ReactNode
