import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import { ReactNode, useCallback } from "react"
import ResizeHandle from "../ui/resize-handle"
import { RenderLeafFn, SplitDirection, SplitNode, SplitTree, WithId } from "./types"
import { generateId, isSplitNode } from "./utils"

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
 * Wraps the tree in a SplitNodeView for recursive rendering.
 */
export function SplitView<T extends WithId>(props: SplitViewProps<T>): ReactNode {
  const { tree, direction = "horizontal", ...rest } = props
  const node = isSplitNode(tree) ? tree : wrapAsSplitNode(tree, direction)
  return <SplitNodeView node={node} {...rest} />
}

/**
 * Props for the SplitNodeView component
 */
interface SplitNodeViewProps<T extends WithId> {
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
function SplitNodeView<T extends WithId>({
  node,
  renderLeaf,
  onTreeChange,
  onDelete,
  canDelete,
  createNode,
}: SplitNodeViewProps<T>): ReactNode {
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
   * - Otherwise, updates the node with remaining children (no promotion)
   */
  const removeChild = useCallback(
    (index: number) => {
      const children = node.children.filter((_, i) => i !== index)
      if (children.length === 0) {
        onDelete()
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
   * - If perpendicular, creates a new nested split node containing both the original and new node
   */
  const splitChild = useCallback(
    (index: number, splitDirection: SplitDirection) => {
      const child = node.children[index]
      if (isSplitNode(child)) return

      const newNode = createNode(child)

      if (splitDirection === node.direction) {
        // Same direction: insert as sibling
        const children = [...node.children]
        children.splice(index + 1, 0, newNode)
        onTreeChange({ ...node, children })
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
    <ResizableGroup id={`group-${node.id}`} direction={groupDirection} ratio key={`${childCount}`}>
      {node.children.map((child, i) => (
        <ChildView
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
  )
}

/**
 * Props for the ChildView component
 */
interface ChildViewProps<T extends WithId> {
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
 * Renders a single child node.
 * - If the child is a split node, recursively renders a SplitNodeView
 * - Otherwise, renders the leaf using the provided renderLeaf function
 * - Adds a resize handle before each child except the first one
 */
function ChildView<T extends WithId>({
  child,
  index,
  renderLeaf,
  onUpdate,
  onClose,
  onSplit,
  canDelete,
  createNode,
}: ChildViewProps<T>): ReactNode {
  // Get stable ID for the panel - use child.id for both leaf and split node
  const childId = child.id

  return (
    <>
      {/* Add resize handle between panels */}
      {index > 0 && <ResizeHandle className="w-px bg-(--rp-border-color)" />}
      <ResizablePanel id={`panel-${childId}`} key={childId}>
        {isSplitNode(child) ? (
          <SplitNodeView
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
function wrapAsSplitNode<T extends WithId>(leaf: T, direction: SplitDirection): SplitNode<T> {
  return { id: generateId(), direction, children: [leaf] }
}
