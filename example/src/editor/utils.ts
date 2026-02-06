import { EditorGroup, SplitDirection, SplitNode, SplitTree, Tab } from "./types"

/**
 * Utility functions for managing the editor state and split tree structure
 *
 * Provides helper functions for:
 * - ID generation
 * - Type guards for tree nodes
 * - Tree traversal and manipulation (find, remove, update)
 * - Split operations
 * - Default sample data
 */

/**
 * Generates a unique random ID string
 * Uses base-36 encoding of a random number
 */
export const generateId = () => Math.random().toString(36).slice(2, 11)

/**
 * Type guard to check if a node is a SplitNode (has children)
 */
export const isSplitNode = <T>(node: SplitTree<T>): node is SplitNode<T> =>
  Array.isArray((node as SplitNode<T>).children)

/**
 * Type guard to check if a node is an EditorGroup (has tabs property)
 */
export const isEditorGroup = (node: SplitNode | EditorGroup): node is EditorGroup => "tabs" in node

/**
 * Recursively searches for an EditorGroup by ID in the split tree
 * Returns null if not found
 */
export const findGroup = (tree: SplitNode | EditorGroup, groupId: string): EditorGroup | null => {
  if (isEditorGroup(tree)) {
    return tree.id === groupId ? tree : null
  }
  for (const child of tree.children) {
    const found = findGroup(child, groupId)
    if (found) return found
  }
  return null
}

/**
 * Removes an EditorGroup by ID from the split tree
 * Cleans up empty parent nodes and flattens single-child nodes
 * Returns null if the entire tree is removed
 */
export const removeGroup = (tree: SplitNode | EditorGroup, groupId: string): SplitNode | EditorGroup | null => {
  if (isEditorGroup(tree)) {
    return tree.id === groupId ? null : tree
  }

  const newChildren = tree.children
    .map((child) => removeGroup(child, groupId))
    .filter((child): child is SplitNode | EditorGroup => child !== null)

  if (newChildren.length === 0) return null
  if (newChildren.length === 1) return newChildren[0]

  return { ...tree, children: newChildren, sizes: tree.sizes.slice(0, newChildren.length) }
}

/**
 * Generic tree operations - work with any leaf node type
 * These functions provide flexible tree manipulation for custom data structures
 */

/**
 * Recursively finds a leaf node matching the given predicate function
 * Generic version that works with any leaf type
 */
export const findNode = <T>(tree: SplitTree<T>, predicate: (node: T) => boolean): T | null => {
  if (isSplitNode(tree)) {
    for (const child of tree.children) {
      const found = findNode(child, predicate)
      if (found) return found
    }
    return null
  }
  return predicate(tree) ? tree : null
}

/**
 * Removes a leaf node by ID from the split tree
 * Generic version that works with any leaf type
 * Handles cleanup and flattening like removeGroup
 */
export const removeNode = <T>(tree: SplitTree<T>, nodeId: string): SplitTree<T> | null => {
  if (isSplitNode(tree)) {
    const newChildren = tree.children
      .map((child) => removeNode(child, nodeId))
      .filter((child): child is SplitTree<T> => child !== null)

    if (newChildren.length === 0) return null
    if (newChildren.length === 1) return newChildren[0]

    return { ...tree, children: newChildren, sizes: tree.sizes.slice(0, newChildren.length) }
  }
  return (tree as { id: string }).id === nodeId ? null : tree
}

/**
 * Updates a leaf node by ID using the provided updater function
 * Returns a new tree with the updated node (immutable update)
 */
export const updateNode = <T>(tree: SplitTree<T>, nodeId: string, updater: (node: T) => T): SplitTree<T> => {
  if (isSplitNode(tree)) {
    return {
      ...tree,
      children: tree.children.map((child) => updateNode(child, nodeId, updater)),
    }
  }
  if ((tree as { id: string }).id === nodeId) {
    return updater(tree as T)
  }
  return tree
}

/**
 * Creates a new split node containing two children
 * Used when splitting an editor view to create a side-by-side or stacked layout
 */
export const createSplit = <T>(
  originalNode: T,
  newNode: T,
  direction: SplitDirection,
  options?: { id?: string; sizes?: number[] },
): SplitNode<T> => ({
  id: options?.id ?? generateId(),
  direction,
  children: direction === "horizontal" ? [originalNode, newNode] : [originalNode, newNode],
  sizes: options?.sizes ?? [50, 50],
})

/**
 * Default tabs to display when the editor initializes
 * Contains sample React/TypeScript files with code content
 */
export const defaultTabs: Tab[] = [
  {
    id: "1",
    name: "app.tsx",
    language: "TSX",
    iconColor: "text-blue-500",
    content: [
      "import React from 'react'",
      "",
      "function App() {",
      "  return <div>Hello World</div>",
      "}",
      "",
      "export default App",
    ],
  },
  {
    id: "2",
    name: "main.tsx",
    language: "TSX",
    iconColor: "text-blue-500",
    content: [
      "import React from 'react'",
      "import ReactDOM from 'react-dom/client'",
      "import App from './App'",
      "",
      "ReactDOM.createRoot(document.getElementById('root')!).render(",
      "  <React.StrictMode>",
      "    <App />",
      "  </React.StrictMode>",
      ")",
    ],
  },
]

/**
 * Sample file metadata used for generating random new tabs
 * Contains file names, languages, and icon colors
 */
export const sampleFiles = [
  { name: "utils.ts", language: "TS", iconColor: "text-blue-500" },
  { name: "styles.css", language: "CSS", iconColor: "text-sky-400" },
  { name: "config.json", language: "JSON", iconColor: "text-yellow-500" },
  { name: "README.md", language: "MD", iconColor: "text-gray-400" },
]
