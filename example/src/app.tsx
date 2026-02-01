import {
  ContextValue,
  GroupValue,
  PanelValue,
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
  SavedGroupLayout,
  useGroupContext,
  usePanelContext,
  useResizableContext,
} from "@local/resizable-panels"
import { useState } from "react"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import PanelHeader from "./ui/panel-header"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

/**
 * Hook for panel control logic
 * @param panelIndex - Index of the target panel to control
 * @returns Click and double-click handlers
 */
function usePanelControl(panelIndex: number) {
  const group = useGroupContext()

  const handleClick = () => {
    console.debug("[App] handleClick")

    const panels = Array.from(group.panels.values())
    const targetPanel = panels[panelIndex]

    // Click to restore when maximized
    if (group.prevMaximize) {
      group.restorePanels()
      return
    }

    // Click to expand when collapsed
    if (targetPanel.isCollapsed) {
      const isBefore = panelIndex < panels.length / 2
      const delta = isBefore ? targetPanel.openSize : -targetPanel.openSize
      group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
      return
    }

    // Click to collapse when expanded and not maximized
    const isBefore = panelIndex < panels.length / 2
    const delta = isBefore ? -targetPanel.size : targetPanel.size
    group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
  }

  const handleDoubleClick = () => {
    console.debug("[App] handleDoubleClick")

    const panels = Array.from(group.panels.values())
    const targetPanel = panels[panelIndex]

    // Double-click to restore when maximized
    if (group.prevMaximize) {
      group.restorePanels()
      return
    }

    // Double-click to expand when collapsed
    if (targetPanel.isCollapsed) {
      const isBefore = panelIndex < panels.length / 2
      const delta = isBefore ? targetPanel.openSize : -targetPanel.openSize
      group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
      return
    }

    // Double-click to maximize when expanded
    group.maximizePanel(targetPanel)
  }

  return { handleClick, handleDoubleClick }
}

const LeftResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(0)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const RightResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(2)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const BottomResizeHandle = () => {
  const { handleClick, handleDoubleClick } = usePanelControl(1)
  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

/**
 * Toggle panel collapsed state
 */
function togglePanel(panel: PanelValue, group: GroupValue) {
  const panels = Array.from(group.panels.values())
  const panelIndex = panels.findIndex((p) => p.id === panel.id)

  if (panelIndex < 0) return

  // Restore if maximized
  if (group.prevMaximize) {
    group.restorePanels()
  }

  // Expand if collapsed
  if (panel.isCollapsed) {
    const isBefore = panelIndex < panels.length / 2
    const delta = isBefore ? panel.openSize : -panel.openSize
    group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
    return
  }

  // Collapse if expanded
  const isBefore = panelIndex < panels.length / 2
  const delta = isBefore ? -panel.size : panel.size
  group.dragPanel(delta, isBefore ? panelIndex : panelIndex - 1)
}

/**
 * Maximize or restore panel
 */
function toggleMaximize(panel: PanelValue, group: GroupValue) {
  if (group.prevMaximize) {
    group.restorePanels()
  } else {
    group.maximizePanel(panel)
  }
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
          togglePanel(panel, group)
        }}
        onMaximize={() => {
          toggleMaximize(panel, group)
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
          togglePanel(panel, group)
        }}
        onMaximize={() => {
          toggleMaximize(panel, group)
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
          togglePanel(panel, group)
        }}
        onMaximize={() => {
          toggleMaximize(panel, group)
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

/**
 * Editor panel with header
 */
const EditorPanel = () => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Editor tabs */}
      <div className="h-8 flex items-center">
        <div className="px-3 h-full flex items-center bg-background border-r border-border text-sm">
          <span className="text-yellow-500 mr-1.5">JS</span>
          app.tsx
        </div>
        <div className="px-3 h-full flex items-center text-muted-foreground text-sm hover:bg-accent/30 cursor-pointer">
          <span className="text-blue-500 mr-1.5">TS</span>
          main.tsx
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 p-4 overflow-auto font-mono text-sm">
        <div className="text-muted-foreground">
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">1</span>
            <span>
              <span className="text-purple-500">import</span> React <span className="text-purple-500">from</span>{" "}
              <span className="text-green-500">&apos;react&apos;</span>
            </span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">2</span>
            <span></span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">3</span>
            <span>
              <span className="text-purple-500">function</span> <span className="text-blue-500">App</span>() {"{"}
            </span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">4</span>
            <span className="pl-4">
              <span className="text-purple-500">return</span> &lt;div&gt;Hello World&lt;/div&gt;
            </span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">5</span>
            <span>{"}"}</span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">6</span>
            <span></span>
          </div>
          <div className="flex">
            <span className="w-8 text-right pr-4 select-none text-gray-500">7</span>
            <span>
              <span className="text-purple-500">export</span> <span className="text-purple-500">default</span> App
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Storage key for saving layout (v2 includes isMaximized, isCollapsed, openSize)
const LAYOUT_STORAGE_KEY = "resizable-panels-layout-v2"

/**
 * Save layout to localStorage
 */
function saveLayout(ctx: ContextValue) {
  const layout: Record<string, SavedGroupLayout> = {}
  for (const [groupId, group] of ctx.groups) {
    layout[groupId] = {
      panels: Array.from(group.panels.values()).map((p) => ({
        size: p.size,
        openSize: p.openSize,
        isCollapsed: p.isCollapsed,
        isMaximized: p.isMaximized,
      })),
      prevMaximize: group.prevMaximize,
    }
  }
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
  console.debug("[App] Layout saved:", layout)
}

/**
 * Load layout from localStorage
 */
function loadLayout(): Record<string, SavedGroupLayout> | null {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error("[App] Failed to load layout:", e)
  }
  return null
}

function App() {
  // Track panel visibility states
  const [leftVisible, setLeftVisible] = useState(false)
  const [rightVisible, setRightVisible] = useState(false)
  const [bottomVisible, setBottomVisible] = useState(false)

  // Handle layout mount - load saved layout
  const handleLayoutMount = (ctx: ContextValue) => {
    const savedLayout = loadLayout()
    if (!savedLayout) return

    // Apply saved layout
    for (const [groupId, groupData] of Object.entries(savedLayout)) {
      const group = ctx.groups.get(groupId)
      if (!group) continue

      const panels = Array.from(group.panels.values())
      const { panels: savedPanels, prevMaximize } = groupData

      // Apply panel states
      for (let i = 0; i < panels.length && i < savedPanels.length; i++) {
        const panel = panels[i]
        const saved = savedPanels[i]
        panel.size = saved.size
        panel.openSize = saved.openSize
        panel.isCollapsed = saved.isCollapsed
        panel.isMaximized = saved.isMaximized
      }

      // Restore prevMaximize state if exists
      if (prevMaximize && prevMaximize.length === panels.length) {
        group.prevMaximize = prevMaximize
      }

      // Trigger re-render for all panels
      for (const panel of panels) {
        panel.setDirty()
      }
    }
    console.debug("[App] Layout loaded:", savedLayout)
  }

  // Handle layout changes to update visibility states and save
  const handleLayoutChanged = (ctx: ContextValue) => {
    for (const group of ctx.groups.values()) {
      const leftPanel = group.panels.get("left")
      const rightPanel = group.panels.get("right")
      const bottomPanel = group.panels.get("bottom")

      if (leftPanel) setLeftVisible(!leftPanel.isCollapsed)
      if (rightPanel) setRightVisible(!rightPanel.isCollapsed)
      if (bottomPanel) setBottomVisible(!bottomPanel.isCollapsed)
    }
    // Save layout to localStorage
    saveLayout(ctx)
  }

  return (
    <ResizableContext
      className="flex-1 flex flex-col min-w-fit"
      onLayoutMount={handleLayoutMount}
      onLayoutChanged={handleLayoutChanged}
    >
      {/* Menu Bar with panel toggle buttons */}
      <MenuBar leftVisible={leftVisible} rightVisible={rightVisible} bottomVisible={bottomVisible}>
        <span className="font-semibold text-sm m-2">Resizable Panels Demo</span>
      </MenuBar>

      {/* Main content area */}
      <div className="flex-1 flex min-h-40">
        {/* Activity Bar */}
        <ActivityBar>Activity Bar</ActivityBar>

        <ResizableGroup>
          {/* Left Sidebar */}
          <ResizablePanel id="left" collapsible collapsed>
            <LeftPanel />
          </ResizablePanel>
          <LeftResizeHandle />

          <ResizablePanel expand>
            <ResizableGroup direction="row">
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
                collapsed
              >
                <BottomPanel />
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>

          <RightResizeHandle />

          {/* Right Sidebar */}
          <ResizablePanel id="right" collapsible okMaximize collapsed>
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
