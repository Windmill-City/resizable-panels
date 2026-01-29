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
          <ResizablePanel className="border-r" collapsible>
            left
          </ResizablePanel>
          <ResizablePanel minSize={300}>
            <ResizableGroup orientation="vertical">
              {/* Editor */}
              <ResizablePanel collapsible minSize={80}>
                top
              </ResizablePanel>
              {/* Bottom Panel */}
              <ResizablePanel
                className="border-t data-[maximized=true]:border-none"
                collapsible
                minSize={80}
              >
                bottom
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>
          {/* Right Sidebar */}
          <ResizablePanel className="border-l" collapsible>
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
