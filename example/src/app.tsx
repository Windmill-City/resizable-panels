import {
  ContextValue,
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
  useGroupContext,
  usePanelContext,
} from "@local/resizable-panels"
import { toggleCollapse, toggleMaximize, usePanelControl } from "./lib/utils"
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
          toggleMaximize(panel.id, group)
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
          toggleMaximize(panel.id, group)
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
          toggleMaximize(panel.id, group)
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

// Storage key for saving layout
const LAYOUT_STORAGE_KEY = "resizable-panels-layout"

function App() {
  // Handle layout mount - load saved layout
  const handleLayoutMount = (ctx: ContextValue) => {
    const savedLayout = ctx.loadLayout(localStorage.getItem(LAYOUT_STORAGE_KEY))
    ctx.applyLayout(savedLayout)
    console.debug("[App] Layout loaded")
  }

  // Handle layout changes - save changed layout
  const handleLayoutChanged = (ctx: ContextValue) => {
    // Save layout to localStorage
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(ctx.saveLayout()))
    console.debug("[App] Layout saved")
  }

  return (
    <ResizableContext
      className="flex-1 flex flex-col min-w-fit"
      onLayoutMount={handleLayoutMount}
      onLayoutChanged={handleLayoutChanged}
    >
      {/* Menu Bar with panel toggle buttons */}
      <MenuBar>
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
