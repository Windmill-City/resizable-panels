import {
  ResizableContext,
  ResizableGroup,
  ResizablePanel,
} from "@local/resizable-panels"
import ActivityBar from "./ui/activity-bar"
import MenuBar from "./ui/menu-bar"
import StatusBar from "./ui/status-bar"

function App() {
  return (
    <div className="flex-1 flex flex-col min-w-fit">
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      <div className="flex-1 flex">
        {/* Activity Bar */}
        <ActivityBar>Activity Bar</ActivityBar>
        <ResizableContext>
          <ResizableGroup>
            {/* Left Sidebar */}
            <ResizablePanel className="border-r" collapsible keepSize>
              left
            </ResizablePanel>
            <ResizablePanel>
              <ResizableGroup direction="row">
                {/* Editor */}
                <ResizablePanel minSize={80} collapsible>
                  top
                </ResizablePanel>
                {/* Bottom Panel */}
                <ResizablePanel
                  className="border-t data-[maximized=true]:border-none"
                  minSize={80}
                  collapsible
                  keepSize
                >
                  bottom
                </ResizablePanel>
              </ResizableGroup>
            </ResizablePanel>
            {/* Right Sidebar */}
            <ResizablePanel className="border-l" collapsible keepSize>
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
