"use client";

import { useRef, useEffect } from "react";
import { ResizableContext, useResizableGroupState } from "./context";
import type { ResizableGroupProps } from "./types";

export function ResizableGroup({
  children,
  orientation = "horizontal",
  className = "",
  onLayoutChange,
}: ResizableGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextValue = useResizableGroupState(orientation, containerRef);
  const layoutChangedRef = useRef(onLayoutChange);

  // 保持回调引用最新
  useEffect(() => {
    layoutChangedRef.current = onLayoutChange;
  });

  // 当拖拽结束或最大化状态变化时通知布局变化
  useEffect(() => {
    if (!contextValue.isDragging && layoutChangedRef.current) {
      const sizes: Record<string, number> = {};
      contextValue.panels.forEach((panel, id) => {
        sizes[id] = panel.size;
      });
      layoutChangedRef.current(sizes);
    }
  }, [contextValue.isDragging, contextValue.maximizedPanelId]);

  return (
    <ResizableContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        data-resizable-group
        data-orientation={orientation}
        data-dragging={contextValue.isDragging}
        data-maximized-panel={contextValue.maximizedPanelId || undefined}
        className={className}
        style={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
        }}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
}
