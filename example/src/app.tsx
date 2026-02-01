import { ResizableContext, ResizableGroup, ResizablePanel, useGroupContext } from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

const LeftResizeHandle = () => {
  const group = useGroupContext()

  const handleDoubleClick = () => {
    const leftPanel = group.panels.get("left")!
    group.setCollapse("left", !leftPanel.isCollapsed)
  }

  return <ResizeHandle onDoubleClick={handleDoubleClick} />
}

const RightResizeHandle = () => {
  const group = useGroupContext()

  const handleDoubleClick = () => {
    const rightPanel = group.panels.get("right")!
    group.setCollapse("right", !rightPanel.isCollapsed, true)
  }

  return <ResizeHandle onDoubleClick={handleDoubleClick} />
}

const BottomResizeHandle = () => {
  const group = useGroupContext()

  const handleDoubleClick = () => {
    const bottomPanel = group.panels.get("bottom")!
    group.setCollapse("bottom", !bottomPanel.isCollapsed, true)
  }

  return <ResizeHandle onDoubleClick={handleDoubleClick} />
}

function App() {
  return (
    <div className="flex-1 flex flex-col min-w-fit">
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      {/* min-h-40[160px] here to force bottom panel shrink */}
      <div className="flex-1 flex min-h-40">
        {/* Activity Bar */}
        <ActivityBar>Activity Bar</ActivityBar>
        <ResizableContext>
          <ResizableGroup>
            {/* Left Sidebar */}
            <ResizablePanel id="left" collapsible collapsed>
              left
            </ResizablePanel>
            <LeftResizeHandle />
            <ResizablePanel expand>
              <ResizableGroup direction="row">
                {/* Editor */}
                <ResizablePanel id="editor" minSize={80} collapsible expand>
                  editor
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
                  bottom
                </ResizablePanel>
              </ResizableGroup>
            </ResizablePanel>
            <RightResizeHandle />
            {/* Right Sidebar */}
            <ResizablePanel id="right" collapsible collapsed>
              right
            </ResizablePanel>
          </ResizableGroup>
        </ResizableContext>
      </div>
      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </div>
  )
}

export default App
