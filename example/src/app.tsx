import {
  ContextValue,
  fromJson,
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
  useGroupContext,
  usePanelContext,
} from "@local/resizable-panels"
import { Columns, Plus, Rows, X, XIcon } from "lucide-react"
import { useState } from "react"
import { toggleCollapse, usePanelControl } from "./lib/utils"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import PanelHeader from "./ui/panel-header"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

const LeftResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl("left")
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const RightResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl("right")
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const BottomResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl("bottom")
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

/**
 * Left panel with header
 */
const LeftPanel = () => {
  const group = useGroupContext()
  const panel = usePanelContext()

  return (
    <div className="flex-1 flex flex-col">
      <PanelHeader
        title="Explorer"
        isCollapsed={panel.isCollapsed}
        isMaximized={panel.isMaximized}
        canMaximize={panel.okMaximize}
        onClose={() => {
          toggleCollapse(panel.id, group)
        }}
        onMaximize={() => {
          group.toggleMaximize(panel.id)
        }}
        onRestore={() => {
          group.restorePanels()
        }}
      />
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-sm text-muted-foreground">
          <div className="mb-2">📁 src</div>
          <div className="pl-4 mb-1">📄 app.tsx</div>
          <div className="pl-4 mb-1">📄 main.tsx</div>
          <div className="pl-4 mb-1">📄 index.css</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Right panel with header
 */
const RightPanel = () => {
  const group = useGroupContext()
  const panel = usePanelContext()

  return (
    <div className="flex-1 flex flex-col">
      <PanelHeader
        title="Outline"
        isCollapsed={panel.isCollapsed}
        isMaximized={panel.isMaximized}
        canMaximize={panel.okMaximize}
        onClose={() => {
          toggleCollapse(panel.id, group)
        }}
        onMaximize={() => {
          group.toggleMaximize(panel.id)
        }}
        onRestore={() => {
          group.restorePanels()
        }}
      />
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-sm text-muted-foreground">
          <div className="mb-2">Outline view</div>
          <div className="pl-2">No symbols found</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Bottom panel with header
 */
const BottomPanel = () => {
  const group = useGroupContext()
  const panel = usePanelContext()

  return (
    <div className="flex-1 flex flex-col">
      <PanelHeader
        title="Terminal"
        isCollapsed={panel.isCollapsed}
        isMaximized={panel.isMaximized}
        canMaximize={panel.okMaximize}
        onClose={() => {
          toggleCollapse(panel.id, group)
        }}
        onMaximize={() => {
          group.toggleMaximize(panel.id)
        }}
        onRestore={() => {
          group.restorePanels()
        }}
      />
      <div className="flex-1 p-2 overflow-auto  font-mono text-xs">
        <div className="text-green-600">$ npm run dev</div>
        <div className="text-gray-500 mt-1">VITE v5.0.0 ready in 320 ms</div>
        <div className="text-blue-500 mt-1">➜ Local: http://localhost:5173/</div>
        <div className="text-gray-600 mt-1">➜ Network: use --host to expose</div>
        <div className="text-green-500 mt-2">$ _</div>
      </div>
    </div>
  )
}

// ==================== Editor Split System ====================

interface Tab {
  id: string
  name: string
  language: string
  iconColor: string
  content: string[]
}

type SplitDirection = "horizontal" | "vertical"

interface EditorGroup {
  id: string
  tabs: Tab[]
  activeTabId: string
}

interface SplitNode {
  id: string
  direction: SplitDirection
  children: (SplitNode | EditorGroup)[]
  sizes: number[]
}

const defaultTabs: Tab[] = [
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

const sampleFiles = [
  { name: "utils.ts", language: "TS", iconColor: "text-blue-500" },
  { name: "styles.css", language: "CSS", iconColor: "text-sky-400" },
  { name: "config.json", language: "JSON", iconColor: "text-yellow-500" },
  { name: "README.md", language: "MD", iconColor: "text-gray-400" },
]

const isEditorGroup = (node: SplitNode | EditorGroup): node is EditorGroup => "tabs" in node

const findGroup = (tree: SplitNode | EditorGroup, groupId: string): EditorGroup | null => {
  if (isEditorGroup(tree)) {
    return tree.id === groupId ? tree : null
  }
  for (const child of tree.children) {
    const found = findGroup(child, groupId)
    if (found) return found
  }
  return null
}

const removeGroup = (tree: SplitNode | EditorGroup, groupId: string): SplitNode | EditorGroup | null => {
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

const generateId = () => Math.random().toString(36).substr(2, 9)

// ==================== TabBar Component ====================

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onSplit: (direction: SplitDirection) => void
  onAddTab: () => void
}

const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onSplit, onAddTab }: TabBarProps) => {
  const [_, setShowSplitMenu] = useState(false)

  return (
    <div className="h-9 flex items-center bg-muted/30 overflow-x-auto scrollbar-hide relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowSplitMenu(true)
          }}
          className={`
            group h-full flex items-center gap-2 px-3 min-w-30 max-w-50 
            border-r border-border cursor-pointer select-none text-sm
            transition-colors duration-150
            ${
              activeTabId === tab.id
                ? "bg-background text-foreground border-t-2 border-t-primary"
                : "bg-tab text-muted-foreground hover:bg-tab-hover border-t border-t-transparent"
            }
          `}
          title={tab.name}
        >
          <span className={`${tab.iconColor} text-xs font-medium`}>{tab.language}</span>
          <span className="flex-1 truncate">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
            className={`
              p-0.5 rounded hover:bg-accent/80 opacity-0 group-hover:opacity-100
              ${activeTabId === tab.id ? "opacity-100" : ""}
              transition-opacity
            `}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add new tab button */}
      <button
        onClick={onAddTab}
        className="h-full px-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        title="New File"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Split buttons */}
      <div className="ml-auto flex items-center gap-1 px-2 border-l border-border">
        <button
          onClick={() => onSplit("horizontal")}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Split Right"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSplit("vertical")}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Split Down"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ==================== EditorContent Component ====================

interface EditorContentProps {
  tab: Tab
}

const EditorContent = ({ tab }: EditorContentProps) => {
  return (
    <div className="flex-1 overflow-auto font-mono text-sm bg-background">
      <div className="p-4">
        {tab.content.map((line, index) => (
          <div key={index} className="flex leading-6">
            <span className="w-12 text-right pr-4 select-none text-gray-500 text-xs">{index + 1}</span>
            <span className="text-muted-foreground whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== EditorView Component ====================

interface EditorViewProps {
  group: EditorGroup
  onUpdate: (group: EditorGroup) => void
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canClose: boolean
}

const EditorView = ({ group, onUpdate, onSplit, onClose, canClose }: EditorViewProps) => {
  const activeTab = group.tabs.find((t) => t.id === group.activeTabId) || group.tabs[0]

  const handleTabClick = (tabId: string) => {
    onUpdate({ ...group, activeTabId: tabId })
  }

  const handleTabClose = (tabId: string) => {
    if (group.tabs.length <= 1) return
    const newTabs = group.tabs.filter((t) => t.id !== tabId)
    const newActiveId = group.activeTabId === tabId ? newTabs[0].id : group.activeTabId
    onUpdate({ ...group, tabs: newTabs, activeTabId: newActiveId })
  }

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

// ==================== SplitEditor Component ====================

interface SplitEditorProps {
  tree: SplitNode | EditorGroup
  onUpdate: (tree: SplitNode | EditorGroup) => void
  onClose: () => void
  canClose: boolean
}

const SplitEditor = ({ tree, onUpdate, onClose, canClose }: SplitEditorProps) => {
  if (isEditorGroup(tree)) {
    return (
      <EditorView
        group={tree}
        onUpdate={onUpdate}
        onSplit={(direction) => {
          const activeTab = tree.tabs.find((t) => t.id === tree.activeTabId)
          if (!activeTab) return

          const newGroupId = generateId()
          const newGroup: EditorGroup = {
            id: newGroupId,
            tabs: [{ ...activeTab, id: generateId() }],
            activeTabId: activeTab.id,
          }

          const splitNode: SplitNode = {
            id: generateId(),
            direction,
            children: direction === "horizontal" ? [tree, newGroup] : [tree, newGroup],
            sizes: [50, 50],
          }
          onUpdate(splitNode)
        }}
        onClose={onClose}
        canClose={canClose}
      />
    )
  }

  const direction = tree.direction === "horizontal" ? "col" : "row"
  const ChildEditor = ({ child, index }: { child: SplitNode | EditorGroup; index: number }) => {
    return (
      <>
        {index > 0 && <ResizeHandle />}
        <ResizablePanel id={`panel-${child.id}`} className="min-w-0 border-l">
          <SplitEditor
            tree={child}
            onUpdate={(newChild) => {
              const newChildren = [...tree.children]
              newChildren[index] = newChild
              onUpdate({ ...tree, children: newChildren })
            }}
            onClose={() => {
              const newChildren = tree.children.filter((_, i) => i !== index)
              if (newChildren.length === 1) {
                onUpdate(newChildren[0])
              } else {
                onUpdate({ ...tree, children: newChildren, sizes: tree.sizes.slice(0, newChildren.length) })
              }
            }}
            canClose={tree.children.length > 1}
          />
        </ResizablePanel>
      </>
    )
  }

  return (
    <ResizableGroup id={`group-${tree.id}`} direction={direction} ratio>
      {tree.children.map((child, index) => (
        <ChildEditor key={child.id} child={child} index={index} />
      ))}
    </ResizableGroup>
  )
}

// ==================== EditorPanel Component ====================

/**
 * Editor panel with VSCode-style split support
 */
const EditorPanel = () => {
  const [splitTree, setSplitTree] = useState<SplitNode | EditorGroup>({
    id: "root",
    tabs: defaultTabs,
    activeTabId: defaultTabs[0].id,
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <SplitEditor tree={splitTree} onUpdate={setSplitTree} onClose={() => {}} canClose={false} />
    </div>
  )
}

// Storage key for saving state
const STATE_STORAGE_KEY = "resizable-panels-state"

function App() {
  // Handle context mount - load saved state
  const handleContextMount = (ctx: ContextValue) => {
    ctx.setState(fromJson(localStorage.getItem(STATE_STORAGE_KEY)))
    console.debug("[App] State loaded")
  }

  // Handle state changes - save changed state
  const handleStateChanged = (ctx: ContextValue) => {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(ctx.getState()))
    console.debug("[App] State saved")
  }

  return (
    <ResizableContext
      className="flex-1 flex flex-col min-w-fit"
      onContextMount={handleContextMount}
      onStateChanged={handleStateChanged}
    >
      {/* Menu Bar with panel toggle buttons */}
      <MenuBar>
        <span className="font-semibold text-sm m-2">Resizable Panels Demo</span>
      </MenuBar>

      {/* Main content area */}
      <div className="flex-1 flex min-h-40">
        {/* Activity Bar */}
        <ActivityBar>Activity Bar</ActivityBar>

        <ResizableGroup id="col">
          {/* Left Sidebar */}
          <ResizablePanel id="left" collapsible>
            <LeftPanel />
          </ResizablePanel>
          <LeftResizeHandle />

          <ResizablePanel id="middle" expand>
            <ResizableGroup id="row" direction="row">
              {/* Editor */}
              <ResizablePanel id="editor" minSize={80} collapsible expand>
                <EditorPanel />
              </ResizablePanel>
              <BottomResizeHandle />

              {/* Bottom Panel */}
              <ResizablePanel
                id="bottom"
                className="border-t data-maximized:border-none data-collapsed:border-none"
                minSize={80}
                collapsible
                okMaximize
              >
                <BottomPanel />
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>

          <RightResizeHandle />

          {/* Right Sidebar */}
          <ResizablePanel id="right" collapsible okMaximize>
            <RightPanel />
          </ResizablePanel>
        </ResizableGroup>
      </div>

      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </ResizableContext>
  )
}

export default App
