import { ResizableContext, ResizableGroup, ResizablePanel, useGroupContext } from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

const LeftResizeHandle = () => {
  const group = useGroupContext()

  const handleClick = () => {
    const leftPanel = group.panels.get("left")!
    if (!group.prevMaximize) {
      group.setCollapse("left", !leftPanel.isCollapsed)
    } else {
      group.setMaximize(undefined)
    }
  }

  const handleDoubleClick = () => {
    const leftPanel = group.panels.get("left")!
    if (!group.prevMaximize && !leftPanel.isCollapsed) {
      group.setMaximize("left")
    }
  }

  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const RightResizeHandle = () => {
  const group = useGroupContext()

  const handleClick = () => {
    const rightPanel = group.panels.get("right")!
    if (!group.prevMaximize) {
      group.setCollapse("right", !rightPanel.isCollapsed, true)
    } else {
      group.setMaximize(undefined)
    }
  }

  const handleDoubleClick = () => {
    const rightPanel = group.panels.get("right")!
    if (!group.prevMaximize && !rightPanel.isCollapsed) {
      group.setMaximize("right")
    }
  }

  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
}

const BottomResizeHandle = () => {
  const group = useGroupContext()

  const handleClick = () => {
    const bottomPanel = group.panels.get("bottom")!
    if (!group.prevMaximize) {
      group.setCollapse("bottom", !bottomPanel.isCollapsed, true)
    } else {
      group.setMaximize(undefined)
    }
  }

  const handleDoubleClick = () => {
    const bottomPanel = group.panels.get("bottom")!
    if (!group.prevMaximize && !bottomPanel.isCollapsed) {
      group.setMaximize("bottom")
    }
  }

  return <ResizeHandle onClick={handleClick} onDoubleClick={handleDoubleClick} />
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
