import { ResizableContext, ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import ResizeHandle from "./ui/resize-handle"
import StatusBar from "./ui/status-bar"

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
            <ResizeHandle />
            <ResizablePanel expand>
              <ResizableGroup direction="row">
                {/* Editor */}
                <ResizablePanel id="editor" minSize={80} collapsible expand>
                  editor
                </ResizablePanel>
                <ResizeHandle />
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
            <ResizeHandle />
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
