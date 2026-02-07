import {
  ContextValue,
  fromJson,
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
  useGroupContext,
  usePanelContext,
} from "@local/resizable-panels"
import { EditorPanel } from "./editor"
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
      className="flex-1 flex flex-col min-w-0"
      onContextMount={handleContextMount}
      onStateChanged={handleStateChanged}
    >
      {/* Menu Bar with panel toggle buttons */}
      <MenuBar>
        <span className="font-semibold text-sm m-2">Resizable Panels Demo</span>
      </MenuBar>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
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
