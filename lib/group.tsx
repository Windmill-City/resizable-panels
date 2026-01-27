"use client";

import { useRef, useEffect } from "react";
import { ResizableContext, useResizableGroupState } from "./context";
import type { ResizableGroupProps } from "./types";

export function ResizableGroup({
  id,
  children,
  orientation = "horizontal",
  className = "",
  onLayoutChange,
  onLayoutChanged,
}: ResizableGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextValue = useResizableGroupState(id, orientation, containerRef);
  const layoutChangeRef = useRef(onLayoutChange);
  const layoutChangedRef = useRef(onLayoutChanged);

  // 保持回调引用最新
  useEffect(() => {
    layoutChangeRef.current = onLayoutChange;
    layoutChangedRef.current = onLayoutChanged;
  });

  // 当拖拽进行时通知布局变化
  useEffect(() => {
    if (contextValue.isDragging && layoutChangeRef.current) {
      const sizes: Record<string, number> = {};
      contextValue.panels.forEach((panel, panelId) => {
        sizes[panelId] = panel.size;
      });
      layoutChangeRef.current(sizes);
    }
  }, [contextValue.isDragging, contextValue.panels]);

  // 当拖拽结束或最大化状态变化时通知布局变化
  useEffect(() => {
    if (!contextValue.isDragging && layoutChangedRef.current) {
      const sizes: Record<string, number> = {};
      contextValue.panels.forEach((panel, panelId) => {
        sizes[panelId] = panel.size;
      });
      layoutChangedRef.current(sizes);
    }
  }, [contextValue.isDragging, contextValue.maximizedPanel, contextValue.panels]);

  return (
    <ResizableContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        data-resizable-group
        data-group-id={id}
        data-orientation={orientation}
        data-dragging={contextValue.isDragging}
        data-maximized-panel={contextValue.maximizedPanel || undefined}
        className={className}
        style={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
}
