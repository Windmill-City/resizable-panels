import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import { ReactNode, useCallback, useState } from "react"
import ResizeHandle from "../ui/resize-handle"
import { RenderLeafFn, SplitDirection, SplitNode, SplitTree } from "./types"
import { generateId, isSplitNode } from "./utils"

/**
 * Props for the SplitView component
 * @template T - The type of leaf node data
 */
export interface SplitViewProps<T> {
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
export function SplitView<T>(props: SplitViewProps<T>): ReactNode {
  const { tree, direction = "horizontal", ...rest } = props
  const node = isSplitNode(tree) ? tree : wrapAsSplitNode(tree, direction)
  return <SplitNodeView node={node} {...rest} />
}

/**
 * Props for the SplitNodeView component
 */
interface SplitNodeViewProps<T> {
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
function SplitNodeView<T>({
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

  // Used to force remount when tree structure changes (group added/removed)
  const [structureVersion, setStructureVersion] = useState(0)

  /**
   * Updates a child node at the specified index.
   * Creates a new children array to maintain immutability.
   */
  const updateChild = useCallback(
    (index: number, newChild: SplitTree<T>) => {
      const oldChild = node.children[index]
      const children = [...node.children]
      children[index] = newChild
      onTreeChange({ ...node, children })
      // Force remount when child type changes (group <-> leaf)
      if (isSplitNode(oldChild) !== isSplitNode(newChild)) {
        setStructureVersion((v) => v + 1)
      }
    },
    [node, onTreeChange],
  )

  /**
   * Removes a child node at the specified index.
   * - If no children left, triggers onDelete
   * - If only one child left, promotes it to replace the current node
   * - Otherwise, updates the node with remaining children
   */
  const removeChild = useCallback(
    (index: number) => {
      const children = node.children.filter((_, i) => i !== index)
      if (children.length === 0) {
        onDelete()
      } else if (children.length === 1) {
        // Force remount when promoting child (group removed)
        setStructureVersion((v) => v + 1)
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
          id: generateId(),
          direction: splitDirection,
          children: [child, newNode],
        })
      }
      // Force remount when tree structure changes
      setStructureVersion((v) => v + 1)
    },
    [node, createNode, onTreeChange, updateChild],
  )

  return (
    <ResizableGroup id={`group-${node.id}`} direction={groupDirection} ratio key={`${childCount}-${structureVersion}`}>
      {node.children.map((child, i) => (
        <ChildView
          key={(child as { id: string }).id}
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
interface ChildViewProps<T> {
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
function ChildView<T>({
  child,
  index,
  renderLeaf,
  onUpdate,
  onClose,
  onSplit,
  canDelete,
  createNode,
}: ChildViewProps<T>): ReactNode {
  return (
    <>
      {/* Add resize handle between panels */}
      {index > 0 && <ResizeHandle />}
      <ResizablePanel
        id={`panel-${(child as { id: string }).id}`}
        className="min-w-0 data-[direction=row]:border-t data-[direction=col]:border-l"
        key={isSplitNode(child) ? "group" : "leaf"}
      >
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
function wrapAsSplitNode<T>(leaf: T, direction: SplitDirection): SplitNode<T> {
  return { id: generateId(), direction, children: [leaf] }
}
