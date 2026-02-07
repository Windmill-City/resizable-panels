import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { ReactNode, useCallback } from "react"
import ResizeHandle from "../ui/resize-handle"
import { RenderLeafFn, SplitDirection, SplitNode, SplitTree, WithId } from "./types"
import { generateId, isSplitNode as isNode } from "./utils"

/**
 * Props for the SplitView component
 * @template T - The type of leaf node data
 */
export interface SplitViewProps<T extends WithId> {
  tree: SplitTree<T>
  renderLeaf: RenderLeafFn<T>
  onTreeChange: (tree: SplitTree<T>) => void
  onDelete: () => void
  canDelete: boolean
  createNode: (originalData: T) => T
  direction?: SplitDirection
}

/**
 * Main entry component for rendering a split view tree.
 * Wraps the tree in a NodeView for recursive rendering.
 */
export function SplitView<T extends WithId>(props: SplitViewProps<T>): ReactNode {
  const { tree, direction = "horizontal", ...rest } = props
  const node = isNode(tree) ? tree : wrapAsNode(tree, direction)
  return <NodeView node={node} {...rest} />
}

/**
 * Props for the NodeView component
 */
interface NodeViewProps<T extends WithId> {
  node: SplitNode<T>
  renderLeaf: RenderLeafFn<T>
  onTreeChange: (tree: SplitTree<T>) => void
  onDelete: () => void
  canDelete: boolean
  createNode: (originalData: T) => T
}

/**
 * Renders a split node with its children in a resizable group.
 * Provides callbacks to update, remove, or split child nodes.
 */
function NodeView<T extends WithId>({
  node,
  renderLeaf,
  onTreeChange,
  onDelete,
  canDelete,
  createNode,
}: NodeViewProps<T>): ReactNode {
  // Map split direction to group direction ('col' for horizontal, 'row' for vertical)
  const groupDirection = node.direction === "horizontal" ? "col" : "row"
  const childCount = node.children.length

  /**
   * Updates a child node at the specified index.
   * Creates a new children array to maintain immutability.
   */
  const updateChild = useCallback(
    (index: number, newChild: SplitTree<T>) => {
      const children = [...node.children]
      children[index] = newChild
      onTreeChange({ ...node, children })
    },
    [node, onTreeChange],
  )

  /**
   * Removes a child node at the specified index.
   * - If no children left, triggers onDelete
   * - If only one child left, promotes that child to replace the current node
   * - Otherwise, updates the node with remaining children
   */
  const removeChild = useCallback(
    (index: number) => {
      const children = node.children.filter((_, i) => i !== index)
      if (children.length === 0) {
        onDelete()
      } else if (children.length === 1) {
        onTreeChange(children[0])
      } else {
        onTreeChange({
          ...node,
          children,
        })
      }
    },
    [node, onTreeChange, onDelete],
  )

  /**
   * Splits a leaf node at the specified index.
   * - If split direction matches the node's direction, inserts a new sibling
   * - If perpendicular and only one child exists, changes direction instead of nesting
   * - If perpendicular and multiple children exist, creates a nested split node
   */
  const splitChild = useCallback(
    (index: number, splitDirection: SplitDirection) => {
      const child = node.children[index] as T

      const newNode = createNode(child)

      if (splitDirection === node.direction) {
        // Same direction: insert as sibling
        const children = [...node.children]
        children.splice(index + 1, 0, newNode)
        onTreeChange({ ...node, children })
      } else if (node.children.length === 1) {
        // Only one child: change direction instead of nesting
        onTreeChange({
          ...node,
          direction: splitDirection,
          children: [child, newNode],
        })
      } else {
        // Perpendicular direction: create a nested split node
        updateChild(index, {
          id: child.id, // Use child's id to keep the Panel stable
          direction: splitDirection,
          children: [child, newNode],
        })
      }
    },
    [node, createNode, onTreeChange, updateChild],
  )

  return (
    <OverlayScrollbarsComponent className={"h-full w-full [&>*:first-child]:h-full"} defer>
      <ResizableGroup
        id={`group-${node.id}`}
        key={`${childCount}`}
        direction={groupDirection}
        ratio
        className={"overflow-visible!"}
      >
        {node.children.map((child, i) => (
          <LeafView
            key={child.id}
            child={child}
            index={i}
            renderLeaf={renderLeaf}
            onUpdate={(c) => updateChild(i, c)}
            onClose={() => removeChild(i)}
            onSplit={(d) => splitChild(i, d)}
            canDelete={childCount > 1 || canDelete}
            createNode={createNode}
          />
        ))}
      </ResizableGroup>
    </OverlayScrollbarsComponent>
  )
}

/**
 * Props for the LeafView component
 */
interface LeafViewProps<T extends WithId> {
  child: SplitTree<T>
  index: number
  renderLeaf: RenderLeafFn<T>
  onUpdate: (child: SplitTree<T>) => void
  onClose: () => void
  onSplit: (direction: SplitDirection) => void
  canDelete: boolean
  createNode: (originalData: T) => T
}

/**
 * Renders a single leaf node.
 * - If the child is a split node, recursively renders a NodeView
 * - Otherwise, renders the leaf using the provided renderLeaf function
 * - Adds a resize handle before each child except the first one
 */
function LeafView<T extends WithId>({
  child,
  index,
  renderLeaf,
  onUpdate,
  onClose,
  onSplit,
  canDelete,
  createNode,
}: LeafViewProps<T>): ReactNode {
  return (
    <>
      {/* Add resize handle between panels */}
      {index > 0 && (
        <ResizeHandle className={"data-[direction=row]:h-px data-[direction=col]:w-px bg-(--rp-border-color)"} />
      )}
      <ResizablePanel id={`panel-${child.id}`} key={child.id}>
        {isNode(child) ? (
          <NodeView
            node={child}
            renderLeaf={renderLeaf}
            onTreeChange={onUpdate}
            onDelete={onClose}
            canDelete={canDelete}
            createNode={createNode}
          />
        ) : (
          renderLeaf({ data: child, onUpdate, onSplit, onClose, canClose: canDelete })
        )}
      </ResizablePanel>
    </>
  )
}

/**
 * Wraps a leaf node as a split node with the specified direction.
 * Used to normalize the tree structure for consistent rendering.
 */
function wrapAsNode<T extends WithId>(leaf: T, direction: SplitDirection): SplitNode<T> {
  return { id: generateId(), direction, children: [leaf] }
}
