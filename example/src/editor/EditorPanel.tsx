import { useCallback, useState } from "react"
import { EditorView } from "./EditorView"
import { SplitView } from "./SplitView"
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
    }) => <EditorView group={data} onUpdate={onUpdate} onSplit={onSplit} onClose={onClose} canClose={canClose} />,
    [],
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
