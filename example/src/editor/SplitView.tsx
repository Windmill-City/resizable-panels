import { ReactNode, useCallback } from "react"
import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import ResizeHandle from "../ui/resize-handle"
import { SplitNode, SplitTree, SplitDirection, RenderLeafFn } from "./types"
import { isSplitNode, generateId } from "./utils"

export interface SplitViewProps<T> {
  tree: SplitTree<T>
  /** Function to render leaf nodes */
  renderLeaf: RenderLeafFn<T>
  /** Callback when tree structure changes */
  onUpdate: (tree: SplitTree<T>) => void
  /** Callback to close current node */
  onClose: () => void
  /** Whether the node can be closed (usually false when there's only one node) */
  canClose: boolean
  /** Factory function to create new nodes (used when splitting) */
  createNode?: (originalData: T) => T
}

/**
 * Generic split view component
 *
 * Recursively renders a split tree structure with resizable panels.
 * Each SplitNode is rendered as a ResizableGroup containing multiple panels.
 * Leaf nodes are rendered using the renderLeaf function.
 *
 * Handles:
 * - Recursive tree rendering
 * - Panel resizing via ResizableGroup/ResizablePanel
 * - Split operations (horizontal/vertical)
 * - Close operations with automatic tree flattening
 */
export const SplitView = <T extends { id: string }>({
  tree,
  renderLeaf,
  onUpdate,
  onClose,
  canClose,
  createNode,
}: SplitViewProps<T>): ReactNode => {
  // Render leaf node directly when tree is not a SplitNode
  if (!isSplitNode(tree)) {
    const data = tree

    const handleSplit = (direction: SplitDirection) => {
      if (!createNode) return

      const newNode = createNode(data)
      const splitNode: SplitNode<T> = {
        id: generateId(),
        direction,
        children: direction === "horizontal" ? [data, newNode] : [data, newNode],
        sizes: [50, 50],
      }
      onUpdate(splitNode)
    }

    return (
      <>
        {renderLeaf({
          data,
          onUpdate: (newData) => onUpdate(newData),
          onSplit: handleSplit,
          onClose,
          canClose,
        })}
      </>
    )
  }

  const direction = tree.direction === "horizontal" ? "col" : "row"
  const childrenCount = tree.children.length

  // Update a child node at specific index (stable callback)
  const handleChildUpdate = useCallback((index: number, newChild: SplitTree<T>) => {
    const newChildren = [...tree.children]
    newChildren[index] = newChild
    onUpdate({ ...tree, children: newChildren })
  }, [tree, onUpdate])

  const handleChildClose = useCallback((index: number) => {
    const newChildren = tree.children.filter((_, i) => i !== index)
    if (newChildren.length === 1) {
        // If only one child remains, promote it to replace the parent
      onUpdate(newChildren[0])
    } else {
      // Otherwise update parent's children array
      onUpdate({ ...tree, children: newChildren, sizes: tree.sizes.slice(0, newChildren.length) })
    }
  }, [tree, onUpdate])

  return (
    <ResizableGroup id={`group-${tree.id}`} direction={direction} ratio>
      {tree.children.map((child, index) => {
        const childCanClose = childrenCount > 1
        
        return (
          <ChildView
            key={(child as { id: string }).id}
            child={child}
            index={index}
            renderLeaf={renderLeaf}
            onUpdate={(newChild) => handleChildUpdate(index, newChild)}
            onClose={() => handleChildClose(index)}
            canClose={childCanClose}
            createNode={createNode}
          />
        )
      })}
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
  canClose: boolean
  createNode?: (originalData: T) => T
}

/**
 * Renders a single child within a ResizablePanel
 * Wraps the child with a resize handle (except for the first child)
 * and recursively renders SplitView for nested structures
 */
const ChildView = <T extends { id: string }>({
  child,
  index,
  renderLeaf,
  onUpdate,
  onClose,
  canClose,
  createNode,
}: ChildViewProps<T>): ReactNode => {
  return (
    <>
      {index > 0 && <ResizeHandle />}
      <ResizablePanel id={`panel-${(child as { id: string }).id}`} className="min-w-0 border-l">
        <SplitView
          tree={child}
          renderLeaf={renderLeaf}
          onUpdate={onUpdate}
          onClose={onClose}
          canClose={canClose}
          createNode={createNode}
        />
      </ResizablePanel>
    </>
  )
}
