import { ResizableContext, ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
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
            <ResizablePanel
              className="border-r data-[maximized=true]:border-none data-[collapsed=true]:border-none"
              collapsible
            >
              left
            </ResizablePanel>
            <ResizablePanel expand>
              <ResizableGroup direction="row">
                {/* Editor */}
                <ResizablePanel minSize={80} collapsible expand>
                  top
                </ResizablePanel>
                {/* Bottom Panel */}
                <ResizablePanel
                  className="border-t data-[maximized=true]:border-none data-[collapsed=true]:border-none"
                  minSize={80}
                  collapsible
                  okMaximize
                >
                  bottom
                </ResizablePanel>
              </ResizableGroup>
            </ResizablePanel>
            {/* Right Sidebar */}
            <ResizablePanel
              className="border-l  data-[maximized=true]:border-none data-[collapsed=true]:border-none"
              collapsible
            >
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
