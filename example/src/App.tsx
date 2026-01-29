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
    <>
      {/* Menu */}
      <MenuBar>Menu</MenuBar>
      <ResizableContext>
        <ResizableGroup>
          {/* Activity Bar */}
          <ActivityBar>Activity Bar</ActivityBar>
          {/* Left Sidebar */}
          <ResizablePanel className="border-r" collapsible keepSize>
            left
          </ResizablePanel>
          <ResizablePanel minSize={300}>
            <ResizableGroup orientation="vertical">
              {/* Editor */}
              <ResizablePanel collapsible>
                top
              </ResizablePanel>
              {/* Bottom Panel */}
              <ResizablePanel
                className="border-t data-[maximized=true]:border-none"
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
      {/* Status Bar */}
      <StatusBar>Status</StatusBar>
    </>
  )
}

export default App
