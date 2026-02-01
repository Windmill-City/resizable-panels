import { ResizableHandle } from "@local/resizable-panels"
import { cn } from "../lib/utils"

interface ResizeHandleProps {
  onDoubleClick?: () => void
}

const ResizeHandle = ({ onDoubleClick }: ResizeHandleProps) => {
  return (
    <ResizableHandle
      data-resizable-handle
      className={cn(
        "relative",
        // after base
        "after:absolute after:inset-0 after:content-['']",
        // :after style
        "data-hover:after:bg-(--rp-handle-accent) after:transition-colors",
        // row direction
        "data-[direction=row]:after:-translate-y-1/2",
        "data-[direction=row]:after:h-1",
        // col direction
        "data-[direction=col]:after:-translate-x-1/2",
        "data-[direction=col]:after:w-1",
      )}
      onDoubleClick={onDoubleClick}
    />
  )
}

export default ResizeHandle
