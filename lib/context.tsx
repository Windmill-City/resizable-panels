"use client";

import { createContext, useContext, useRef, useCallback, useState, useEffect } from "react";
import type { ResizableGroupContextValue, PanelData, Orientation } from "./types";

// 计算 Group 容器的总大小
function getGroupSize(container: HTMLElement, orientation: Orientation): number {
  const rect = container.getBoundingClientRect();
  return orientation === "horizontal" ? rect.width : rect.height;
}

export const ResizableContext = createContext<ResizableGroupContextValue | null>(null);

export function useResizableContext() {
  const context = useContext(ResizableContext);
  if (!context) {
    throw new Error("useResizableContext must be used within ResizableGroup");
  }
  return context;
}

export function useResizableGroupState(orientation: Orientation, containerRef: React.RefObject<HTMLElement | null>) {
  const panelsRef = useRef<Map<string, PanelData>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandleIndex, setDragHandleIndex] = useState(-1);
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);

  const registerPanel = useCallback((id: string, panel: PanelData) => {
    panelsRef.current.set(id, panel);
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    panelsRef.current.delete(id);
  }, []);

  const updatePanelSize = useCallback((id: string, size: number) => {
    const panel = panelsRef.current.get(id);
    if (panel) {
      panel.size = size;
      panel.isCollapsed = panel.collapsible && size <= (panel.collapsedSize ?? 0);
    }
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    const panel = panelsRef.current.get(id);
    if (!panel || !panel.collapsible) return;

    // 如果当前有面板最大化，先恢复
    if (maximizedPanelId && maximizedPanelId !== id) {
      const maxPanel = panelsRef.current.get(maximizedPanelId);
      if (maxPanel && maxPanel.isMaximized) {
        // 恢复所有面板
        if (maxPanel.prevSizes) {
          panelsRef.current.forEach((p, panelId) => {
            if (panelId !== maximizedPanelId && maxPanel.prevSizes![panelId] !== undefined) {
              p.size = maxPanel.prevSizes![panelId];
              p.isCollapsed = p.size <= (p.collapsedSize ?? 0);
            }
          });
        }
        maxPanel.size = maxPanel.prevSize ?? maxPanel.defaultSize ?? 200;
        maxPanel.isMaximized = false;
        maxPanel.prevSizes = undefined;
      }
      setMaximizedPanelId(null);
    }

    if (panel.isCollapsed) {
      // 展开：恢复到之前的大小或默认大小
      panel.size = panel.prevSize ?? panel.defaultSize ?? panel.minSize ?? 100;
      panel.isCollapsed = false;
    } else {
      // 折叠：保存当前大小，然后折叠
      panel.prevSize = panel.size;
      panel.size = panel.collapsedSize ?? 0;
      panel.isCollapsed = true;
    }
  }, [maximizedPanelId]);

  const getPanelSize = useCallback((id: string) => {
    return panelsRef.current.get(id)?.size ?? 0;
  }, []);

  // 使用 ref 存储 maximize 状态，避免循环依赖
  const maximizedPanelIdRef = useRef<string | null>(null);
  
  // 同步 ref 和 state
  useEffect(() => {
    maximizedPanelIdRef.current = maximizedPanelId;
  }, [maximizedPanelId]);

  const toggleMaximize = useCallback((targetId: string) => {
    const panel = panelsRef.current.get(targetId);
    if (!panel || !panel.maximizable) return;

    const container = containerRef.current;
    if (!container) return;

    // 如果点击的是当前已最大化的面板，则恢复
    // 如果点击的是其他面板，先恢复当前最大化的，再最大化新的
    const currentMaxId = maximizedPanelIdRef.current;
    
    if (currentMaxId && currentMaxId !== targetId) {
      // 先恢复当前最大化的面板
      const currentMaxPanel = panelsRef.current.get(currentMaxId);
      if (currentMaxPanel && currentMaxPanel.isMaximized && currentMaxPanel.prevSizes) {
        panelsRef.current.forEach((p, panelId) => {
          if (panelId !== currentMaxId && currentMaxPanel.prevSizes![panelId] !== undefined) {
            p.size = currentMaxPanel.prevSizes![panelId];
            p.isCollapsed = p.size <= (p.collapsedSize ?? 0);
          }
        });
        currentMaxPanel.size = currentMaxPanel.prevSize ?? currentMaxPanel.defaultSize ?? 200;
        currentMaxPanel.isMaximized = false;
        currentMaxPanel.prevSizes = undefined;
      }
    }

    if (panel.isMaximized) {
      // 恢复：使用快照恢复所有面板大小
      if (panel.prevSizes) {
        panelsRef.current.forEach((p, panelId) => {
          if (panelId !== targetId && panel.prevSizes![panelId] !== undefined) {
            p.size = panel.prevSizes![panelId];
            p.isCollapsed = p.size <= (p.collapsedSize ?? 0);
          }
        });
      }
      // 恢复自己的大小
      panel.size = panel.prevSize ?? panel.defaultSize ?? 200;
      panel.isMaximized = false;
      panel.prevSizes = undefined;
      setMaximizedPanelId(null);
      maximizedPanelIdRef.current = null;
    } else {
      // 先取消其他面板的折叠状态，以便保存正确的快照
      panelsRef.current.forEach((p) => {
        if (p.isCollapsed) {
          p.isCollapsed = false;
          p.size = p.prevSize ?? p.defaultSize ?? p.minSize ?? 50;
        }
      });

      // 最大化：保存所有面板当前大小，然后将此面板设为容器大小减去其他面板 minSize 总和
      const groupSize = getGroupSize(container, orientation);
      const prevSizes: Record<string, number> = {};
      
      let otherPanelsMinTotal = 0;
      panelsRef.current.forEach((p, panelId) => {
        prevSizes[panelId] = p.size;
        if (panelId !== targetId) {
          otherPanelsMinTotal += p.minSize ?? 50;
        }
      });
      
      panel.prevSizes = prevSizes;
      panel.prevSize = panel.size;
      panel.size = Math.max(groupSize - otherPanelsMinTotal, panel.minSize ?? 100);
      panel.isMaximized = true;
      setMaximizedPanelId(targetId);
      maximizedPanelIdRef.current = targetId;
      
      // 其他面板设为最小大小
      panelsRef.current.forEach((p, panelId) => {
        if (panelId !== targetId) {
          p.size = p.minSize ?? 50;
        }
      });
    }
  }, [containerRef, orientation]);

  const startDragging = useCallback((handleIndex: number) => {
    // 拖拽时如果有最大化面板，先恢复
    const currentMaxId = maximizedPanelIdRef.current;
    if (currentMaxId) {
      const panel = panelsRef.current.get(currentMaxId);
      if (panel && panel.isMaximized) {
        // 恢复所有面板
        if (panel.prevSizes) {
          panelsRef.current.forEach((p, panelId) => {
            if (panelId !== currentMaxId && panel.prevSizes![panelId] !== undefined) {
              p.size = panel.prevSizes![panelId];
              p.isCollapsed = p.size <= (p.collapsedSize ?? 0);
            }
          });
        }
        panel.size = panel.prevSize ?? panel.defaultSize ?? 200;
        panel.isMaximized = false;
        panel.prevSizes = undefined;
        setMaximizedPanelId(null);
        maximizedPanelIdRef.current = null;
      }
    }
    setIsDragging(true);
    setDragHandleIndex(handleIndex);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    setDragHandleIndex(-1);
  }, []);

  return {
    orientation,
    panels: panelsRef.current,
    registerPanel,
    unregisterPanel,
    updatePanelSize,
    toggleCollapse,
    toggleMaximize,
    getPanelSize,
    isDragging,
    dragHandleIndex,
    maximizedPanelId,
    startDragging,
    stopDragging,
  };
}
