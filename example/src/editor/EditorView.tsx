import { XIcon } from "lucide-react"
import { EditorContent } from "./EditorContent"
import { TabBar } from "./TabBar"
import { EditorGroup, SplitDirection, Tab } from "./types"
import { generateId, sampleFiles } from "./utils"

/**
 * EditorView - Renders a single editor group with tab bar, breadcrumbs, and content
 *
 * Manages tab interactions within one editor pane:
 * - Tab switching, closing, and adding new tabs
 * - Displays file breadcrumbs navigation
 * - Provides close button for editor groups
 *
 * Used as the leaf component inside SplitView for each editor pane.
 */

export interface EditorViewProps {
  group: EditorGroup
  onUpdate: (group: EditorGroup) => void
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canClose: boolean
}

export const EditorView = ({ group, onUpdate, onSplit, onClose, canClose }: EditorViewProps) => {
  const activeTab = group.tabs.find((t) => t.id === group.activeTabId) || group.tabs[0]

  // Switch to the clicked tab by updating the active tab ID
  const handleTabClick = (tabId: string) => {
    onUpdate({ ...group, activeTabId: tabId })
  }

  // Close a tab and auto-switch to another tab if the active one is closed
  const handleTabClose = (tabId: string) => {
    if (group.tabs.length <= 1) return
    const newTabs = group.tabs.filter((t) => t.id !== tabId)
    const newActiveId = group.activeTabId === tabId ? newTabs[0].id : group.activeTabId
    onUpdate({ ...group, tabs: newTabs, activeTabId: newActiveId })
  }

  // Create a new tab with randomly generated sample file content
  const handleAddTab = () => {
    const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)]
    const newTab: Tab = {
      id: generateId(),
      name: randomFile.name,
      language: randomFile.language,
      iconColor: randomFile.iconColor,
      content: [
        `// ${randomFile.name}`,
        "// Generated content",
        "",
        `export default function ${randomFile.name.replace(/\.\w+$/, "")}() {`,
        "  // TODO: Implement",
        "}",
      ],
    }
    onUpdate({ ...group, tabs: [...group.tabs, newTab], activeTabId: newTab.id })
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full min-w-0">
      <TabBar
        tabs={group.tabs}
        activeTabId={group.activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onSplit={onSplit}
        onAddTab={handleAddTab}
      />

      {/* Breadcrumbs */}
      <div className="h-6 flex items-center px-4 text-xs text-muted-foreground border-b bg-background">
        <span>src</span>
        <span className="mx-1.5">›</span>
        <span>{activeTab?.name}</span>
        {canClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Close Editor Group"
          >
            <XIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {activeTab && <EditorContent tab={activeTab} />}
    </div>
  )
}
