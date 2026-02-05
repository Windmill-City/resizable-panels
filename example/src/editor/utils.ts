import { Tab, EditorGroup, SplitNode, SplitTree } from "./types"

export const generateId = () => Math.random().toString(36).substr(2, 9)

export const isSplitNode = <T,>(node: SplitTree<T>): node is SplitNode<T> =>
  "children" in node && Array.isArray((node as SplitNode<T>).children)

export const isEditorGroup = (node: SplitNode | EditorGroup): node is EditorGroup => "tabs" in node

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

// 通用树操作函数 - 适用于任意类型的叶子节点
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

// 创建一个分屏节点，将现有节点分成两个
export const createSplit = <T>(
  originalNode: T,
  newNode: T,
  direction: SplitDirection,
  options?: { id?: string; sizes?: number[] }
): SplitNode<T> => ({
  id: options?.id ?? generateId(),
  direction,
  children: direction === "horizontal" ? [originalNode, newNode] : [originalNode, newNode],
  sizes: options?.sizes ?? [50, 50],
})

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

export const sampleFiles = [
  { name: "utils.ts", language: "TS", iconColor: "text-blue-500" },
  { name: "styles.css", language: "CSS", iconColor: "text-sky-400" },
  { name: "config.json", language: "JSON", iconColor: "text-yellow-500" },
  { name: "README.md", language: "MD", iconColor: "text-gray-400" },
]
