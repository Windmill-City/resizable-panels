"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useResizableContext } from "./context";
import type { ResizablePanelProps } from "./types";

export function ResizablePanel({
  children,
  id,
  defaultSize = 200,
  minSize = 50,
  collapsible = false,
  collapsedSize = 0,
  maximizable = false,
  className = "",
}: ResizablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const context = useResizableContext();
  
  // 存储面板数据
  const panelDataRef = useRef({
    id,
    size: defaultSize,
    minSize,
    defaultSize,
    collapsible,
    collapsedSize,
    isCollapsed: false,
    prevSize: defaultSize,
    maximizable,
    isMaximized: false,
    prevSizes: undefined as Record<string, number> | undefined,
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // 更新 maximizable 属性
  useEffect(() => {
    panelDataRef.current.maximizable = maximizable;
  }, [maximizable]);
  
  // 注册面板
  useEffect(() => {
    context.registerPanel(id, panelDataRef.current);
    return () => context.unregisterPanel(id);
  }, [id, context]);

  // 同步折叠和最大化状态
  useEffect(() => {
    const checkStates = () => {
      const panel = context.panels.get(id);
      if (panel) {
        setIsCollapsed(panel.isCollapsed ?? false);
        setIsMaximized(panel.isMaximized ?? false);
      }
    };
    
    checkStates();
    
    let rafId: number;
    const loop = () => {
      checkStates();
      rafId = requestAnimationFrame(loop);
    };
    
    if (context.isDragging || context.maximizedPanel) {
      rafId = requestAnimationFrame(loop);
    }
    
    return () => cancelAnimationFrame(rafId);
  }, [id, context.panels, context.isDragging, context.maximizedPanel]);

  // 计算当前大小
  const getSize = useCallback(() => {
    const panel = context.panels.get(id);
    if (!panel) return defaultSize;
    
    if (panel.isCollapsed) {
      return panel.collapsedSize ?? 0;
    }
    
    return Math.max(panel.size, panel.minSize ?? 0);
  }, [id, context.panels, defaultSize]);

  const [size, setSize] = useState(defaultSize);

  useEffect(() => {
    const updateSize = () => {
      setSize(getSize());
    };
    
    updateSize();
    
    let rafId: number;
    const loop = () => {
      updateSize();
      rafId = requestAnimationFrame(loop);
    };
    
    if (context.isDragging) {
      rafId = requestAnimationFrame(loop);
    }
    
    return () => cancelAnimationFrame(rafId);
  }, [getSize, context.isDragging]);

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
        [isHorizontal ? "minWidth" : "minHeight"]: collapsible ? collapsedSize : minSize,
        [isHorizontal ? "minHeight" : "minWidth"]: 0,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
