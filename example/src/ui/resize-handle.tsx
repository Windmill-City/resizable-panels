import { ResizableHandle } from "@local/resizable-panels"
import { cn } from "../lib/utils"

const ResizeHandle = () => {
  return (
    <ResizableHandle
      className={cn(
        "relative",
        // after base
        "after:inset-0 after:content-['']",
        // :after style
        "after:absolute data-hover:after:bg-blue-600/50 after:transition-colors",
        // row direction
        "data-[direction=row]:after:-translate-y-1/2",
        "data-[direction=row]:after:h-1.5",
        // col direction
        "data-[direction=col]:after:-translate-x-1/2",
        "data-[direction=col]:after:w-1.5",
      )}
    />
  )
}

export default ResizeHandle
