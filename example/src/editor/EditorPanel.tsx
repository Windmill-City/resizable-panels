import { useState, useCallback } from "react"
import { SplitView } from "./SplitView"
import { EditorView } from "./EditorView"
import { EditorGroup, SplitTree } from "./types"
import { defaultTabs, generateId } from "./utils"

/**
 * 创建新的编辑器组（用于分屏时复制当前标签）
 */
const createEditorGroup = (original: EditorGroup): EditorGroup => {
  const activeTab = original.tabs.find((t) => t.id === original.activeTabId)
  if (!activeTab) return { ...original, id: generateId() }

  const newTabId = generateId()
  return {
    id: generateId(),
    tabs: [{ ...activeTab, id: newTabId }],
    activeTabId: newTabId,
  }
}

/**
 * 编辑器面板 - 使用通用的 SplitView 组件
 * 
 * 展示了如何使用 SplitView 的 renderLeaf 属性来渲染编辑器内容
 */
export const EditorPanel = () => {
  const [splitTree, setSplitTree] = useState<SplitTree<EditorGroup>>({
    id: "root",
    tabs: defaultTabs,
    activeTabId: defaultTabs[0].id,
  })

  // 渲染编辑器叶子节点
  const renderEditorLeaf = useCallback(
    ({
      data,
      onUpdate,
      onSplit,
      onClose,
      canClose,
    }: {
      data: EditorGroup
      onUpdate: (data: EditorGroup) => void
      onSplit: (direction: "horizontal" | "vertical") => void
      onClose: () => void
      canClose: boolean
    }) => (
      <EditorView
        group={data}
        onUpdate={onUpdate}
        onSplit={onSplit}
        onClose={onClose}
        canClose={canClose}
      />
    ),
    []
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <SplitView
        tree={splitTree}
        renderLeaf={renderEditorLeaf}
        createNode={createEditorGroup}
        onUpdate={setSplitTree}
        onClose={() => {}}
        canClose={false}
      />
    </div>
  )
}

// ==================== 使用非编辑器内容的示例 ====================

interface SimpleView {
  id: string
  title: string
  content: string
  color: string
}

/**
 * 示例：使用 SplitView 渲染非编辑器内容
 * 
 * 这个组件展示了 SplitView 的通用能力 - 可以容纳任意类型的视图
 */
export const GenericSplitViewExample = () => {
  const [tree, setTree] = useState<SplitTree<SimpleView>>({
    id: "view-1",
    title: "Dashboard",
    content: "This is the main dashboard view with various metrics and charts.",
    color: "bg-blue-50",
  })

  const createView = (original: SimpleView): SimpleView => ({
    id: generateId(),
    title: original.title + " (Copy)",
    content: "Duplicated from: " + original.content,
    color: original.color === "bg-blue-50" ? "bg-green-50" : "bg-blue-50",
  })

  const renderView = ({
    data,
    onSplit,
    onClose,
    canClose,
  }: {
    data: SimpleView
    onUpdate: (data: SimpleView) => void
    onSplit: (direction: "horizontal" | "vertical") => void
    onClose: () => void
    canClose: boolean
  }) => (
    <div className={`flex-1 flex flex-col h-full ${data.color} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{data.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onSplit("horizontal")}
            className="px-3 py-1 text-sm bg-white rounded border hover:bg-gray-50"
          >
            Split Right
          </button>
          <button
            onClick={() => onSplit("vertical")}
            className="px-3 py-1 text-sm bg-white rounded border hover:bg-gray-50"
          >
            Split Down
          </button>
          {canClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded border hover:bg-red-100"
            >
              Close
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
        <p className="text-gray-600">{data.content}</p>
      </div>
    </div>
  )

  return (
    <div className="h-96 border rounded-lg overflow-hidden">
      <SplitView
        tree={tree}
        renderLeaf={renderView}
        createNode={createView}
        onUpdate={setTree}
        onClose={() => {}}
        canClose={false}
      />
    </div>
  )
}
