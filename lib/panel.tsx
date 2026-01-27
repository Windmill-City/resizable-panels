"use client";

import { useEffect, useRef, useState } from "react";
import { useResizableContext } from "./context";
import type { ResizablePanelProps, PanelData } from "./types";

export function ResizablePanel({
  children,
  id,
  defaultSize = 200,
  minSize = 50,
  collapsible = false,
  okMaximize = false,
  className = "",
}: ResizablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const context = useResizableContext();

  // 存储面板数据
  const panelDataRef = useRef<PanelData>({
    id,
    size: defaultSize,
    minSize,
    defaultSize,
    openSize: defaultSize,
    collapsible,
    isCollapsed: false,
    okMaximize,
    isMaximized: false,
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState(defaultSize);

  // 更新 okMaximize 属性
  useEffect(() => {
    panelDataRef.current.okMaximize = okMaximize;
  }, [okMaximize]);

  // 注册面板
  useEffect(() => {
    context.registerPanel(id, panelDataRef.current);
    return () => context.unregisterPanel(id);
  }, [id, context]);

  // 订阅大小变化
  useEffect(() => {
    const updateFromContext = () => {
      const panel = context.panels.get(id);
      if (panel) {
        setIsCollapsed(panel.isCollapsed);
        setIsMaximized(panel.isMaximized);
        setSize(panel.isCollapsed ? 0 : Math.max(panel.size, panel.minSize));
      }
    };

    updateFromContext();
    return context.registerSizeChangeCallback(updateFromContext);
  }, [id, context]);

  const isHorizontal = context.orientation === "horizontal";

  return (
    <div
      ref={panelRef}
      data-resizable-panel
      data-panel-id={id}
      data-collapsed={isCollapsed}
      data-maximized={isMaximized}
      className={className}
      style={{
        [isHorizontal ? "width" : "height"]: size,
        [isHorizontal ? "minWidth" : "minHeight"]: collapsible ? 0 : minSize,
        [isHorizontal ? "minHeight" : "minWidth"]: 0,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
