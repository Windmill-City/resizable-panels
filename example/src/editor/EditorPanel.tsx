import { useCallback, useState } from "react"
import { EditorView } from "./EditorView"
import { SplitView } from "./SplitView"
import { EditorGroup, RenderLeafFn, SplitTree } from "./types"
import { defaultTabs, generateId } from "./utils"

/**
 * EditorPanel - The main container component for the code editor
 *
 * Manages the overall editor state including:
 * - Tab management (open, close, switch tabs)
 * - Split view layout (horizontal/vertical splits)
 * - Editor group creation and duplication
 *
 * This is the top-level component that orchestrates SplitView and EditorView
 * to provide a multi-tab, splittable editor experience.
 */

/**
 * Creates a new editor group by duplicating the currently active tab
 * Used when splitting the editor view to clone the current context
 */
const createEditorGroup = (original: EditorGroup): EditorGroup => {
  const activeTab = original.tabs.find((t) => t.id === original.activeTabId)!
  const newTabId = generateId()
  return {
    id: generateId(),
    tabs: [{ ...activeTab, id: newTabId }],
    activeTabId: newTabId,
  }
}

export const EditorPanel = () => {
  // Root state for the split tree structure, initialized with default tabs
  const [splitTree, setSplitTree] = useState<SplitTree<EditorGroup>>({
    id: "root",
    tabs: defaultTabs,
    activeTabId: defaultTabs[0].id,
  })

  // Render function for editor leaf nodes in the split tree
  // Each leaf represents an independent editor group with its own tabs
  const renderEditorLeaf = useCallback<RenderLeafFn<EditorGroup>>(
    ({ data, onUpdate, onSplit, onClose, canClose }) => (
      <EditorView group={data} onUpdate={onUpdate} onSplit={onSplit} onClose={onClose} canClose={canClose} />
    ),
    [],
  )

  return (
    <SplitView
      tree={splitTree}
      renderLeaf={renderEditorLeaf}
      createNode={createEditorGroup}
      onTreeChange={setSplitTree}
      onDelete={() => {}}
      canDelete={false}
    />
  )
}
