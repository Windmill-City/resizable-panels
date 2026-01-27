"use client";

import { createContext, useContext, useRef, useCallback, useState, useEffect, useSyncExternalStore } from "react";
import type { ResizableGroupContextValue, PanelData, Orientation } from "./types";

// ============ 全局状态管理 ============

interface GroupState {
  id: string;
  orientation: Orientation;
  containerRef: React.RefObject<HTMLElement | null>;
  panels: Map<string, PanelData>;
  handles: HandleInfo[];
  isDragging: boolean;
  dragHandleIndex: number;
  maximizedPanel?: string;
}

interface HandleInfo {
  index: number;
  beforePanelId: string;
  afterPanelId: string;
  position: number;
}

// 拖拽状态
interface DragState {
  startPointer: number;
  groupId: string;
  beforePanelId: string;
  afterPanelId: string;
  beforeStartSize: number;
  afterStartSize: number;
}

// 全局 store
interface GlobalStore {
  groups: Map<string, GroupState>;
  dragState: DragState | null;
  hoveredHandles: Map<string, number>; // groupId -> handleIndex
  subscribers: Set<() => void>;
}

const globalStore: GlobalStore = {
  groups: new Map(),
  dragState: null,
  hoveredHandles: new Map(),
  subscribers: new Set(),
};

function subscribeToGlobalStore(callback: () => void) {
  globalStore.subscribers.add(callback);
  return () => {
    globalStore.subscribers.delete(callback);
  };
}

function notifySubscribers() {
  globalStore.subscribers.forEach(cb => cb());
}

// ============ 工具函数 ============

function getContainerRect(container: HTMLElement) {
  return container.getBoundingClientRect();
}

function getPointerPosition(e: PointerEvent, orientation: Orientation): number {
  return orientation === "horizontal" ? e.clientX : e.clientY;
}

function getContainerStart(rect: DOMRect, orientation: Orientation): number {
  return orientation === "horizontal" ? rect.left : rect.top;
}

function getContainerSize(rect: DOMRect, orientation: Orientation): number {
  return orientation === "horizontal" ? rect.width : rect.height;
}

// ============ 全局事件处理 ============

// 检查点是否在容器内
function isPointInContainer(e: PointerEvent, container: HTMLElement): boolean {
  const rect = container.getBoundingClientRect();
  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
}

// 查找命中的 handles（支持交叉点）
function findHitHandles(e: PointerEvent): Array<{ groupId: string; handleIndex: number }> {
  const hits: Array<{ groupId: string; handleIndex: number }> = [];
  
  globalStore.groups.forEach((group, groupId) => {
    const container = group.containerRef.current;
    if (!container) return;
    
    // 检查点是否在容器内
    if (!isPointInContainer(e, container)) return;
    
    const rect = getContainerRect(container);
    const pointerPos = getPointerPosition(e, group.orientation);
    const containerStart = getContainerStart(rect, group.orientation);
    const relativePos = pointerPos - containerStart;
    
    // 更新 handle 位置
    updateGroupHandlePositions(group);
    
    // 查找命中的 handle
    for (const handle of group.handles) {
      const distance = Math.abs(handle.position - relativePos);
      if (distance < 4) {
        hits.push({ groupId, handleIndex: handle.index });
        break; // 一个 group 同时只能有一个 handle 被命中
      }
    }
  });
  
  return hits;
}

// 更新 group 的 handle 位置
function updateGroupHandlePositions(group: GroupState) {
  const container = group.containerRef.current;
  if (!container) return;
  
  const children = Array.from(container.children);
  let currentPosition = 0;
  
  for (const child of children) {
    if (child.hasAttribute("data-resizable-panel")) {
      const panelId = child.getAttribute("data-panel-id");
      const panel = panelId ? group.panels.get(panelId) : null;
      if (panel) {
        currentPosition += panel.size;
      }
    } else if (child.hasAttribute("data-resizable-handle")) {
      const handleIndex = parseInt(child.getAttribute("data-handle-index") || "-1");
      const handle = group.handles.find(h => h.index === handleIndex);
      if (handle) {
        handle.position = currentPosition;
      }
    }
  }
}

// 全局 pointer down 处理
function handleGlobalPointerDown(e: PointerEvent) {
  const hits = findHitHandles(e);
  if (hits.length === 0) return;
  
  // 开始拖拽第一个命中的 handle
  const primaryHit = hits[0];
  const group = globalStore.groups.get(primaryHit.groupId);
  if (!group) return;
  
  const handle = group.handles.find(h => h.index === primaryHit.handleIndex);
  if (!handle) return;
  
  const beforePanel = group.panels.get(handle.beforePanelId);
  const afterPanel = group.panels.get(handle.afterPanelId);
  if (!beforePanel || !afterPanel) return;
  if (beforePanel.isCollapsed || afterPanel.isCollapsed) return;
  
  // 恢复最大化状态
  if (group.maximizedPanel) {
    const maxPanel = group.panels.get(group.maximizedPanel);
    if (maxPanel && maxPanel.isMaximized) {
      if (maxPanel.openSizes) {
        group.panels.forEach((p, pid) => {
          if (pid !== group.maximizedPanel && maxPanel.openSizes![pid] !== undefined) {
            p.size = maxPanel.openSizes![pid];
            p.isCollapsed = p.size <= 0;
          }
        });
      }
      maxPanel.size = maxPanel.openSize ?? maxPanel.defaultSize;
      maxPanel.isMaximized = false;
      maxPanel.openSizes = undefined;
    }
    group.maximizedPanel = undefined;
  }
  
  // 设置拖拽状态
  const pointerPos = getPointerPosition(e, group.orientation);
  globalStore.dragState = {
    startPointer: pointerPos,
    groupId: primaryHit.groupId,
    beforePanelId: handle.beforePanelId,
    afterPanelId: handle.afterPanelId,
    beforeStartSize: beforePanel.size,
    afterStartSize: afterPanel.size,
  };
  
  group.isDragging = true;
  group.dragHandleIndex = primaryHit.handleIndex;
  
  // 存储交叉点拖拽的其他 group
  if (hits.length > 1) {
    for (let i = 1; i < hits.length; i++) {
      const secondaryHit = hits[i];
      const secondaryGroup = globalStore.groups.get(secondaryHit.groupId);
      if (secondaryGroup) {
        // 标记这些 group 也在拖拽中
        secondaryGroup.isDragging = true;
        secondaryGroup.dragHandleIndex = secondaryHit.handleIndex;
      }
    }
  }
  
  notifySubscribers();
  document.body.style.userSelect = "none";
}

// 全局 pointer move 处理
function handleGlobalPointerMove(e: PointerEvent) {
  // 处理拖拽
  if (globalStore.dragState) {
    const { groupId, startPointer, beforePanelId, afterPanelId, beforeStartSize, afterStartSize } = globalStore.dragState;
    const group = globalStore.groups.get(groupId);
    if (!group) return;
    
    const pointerPos = getPointerPosition(e, group.orientation);
    const delta = pointerPos - startPointer;
    
    const beforePanel = group.panels.get(beforePanelId);
    const afterPanel = group.panels.get(afterPanelId);
    if (!beforePanel || !afterPanel) return;
    
    const beforeMin = beforePanel.minSize;
    const afterMin = afterPanel.minSize;
    
    let newBeforeSize = beforeStartSize + delta;
    let newAfterSize = afterStartSize - delta;
    
    if (newBeforeSize < beforeMin) {
      const diff = beforeMin - newBeforeSize;
      newBeforeSize = beforeMin;
      newAfterSize += diff;
    }
    
    if (newAfterSize < afterMin) {
      const diff = afterMin - newAfterSize;
      newAfterSize = afterMin;
      newBeforeSize += diff;
    }
    
    if (beforePanel.collapsible && newBeforeSize <= 5) {
      newBeforeSize = 0;
      newAfterSize = beforeStartSize + afterStartSize;
    }
    
    if (afterPanel.collapsible && newAfterSize <= 5) {
      newAfterSize = 0;
      newBeforeSize = beforeStartSize + afterStartSize;
    }
    
    beforePanel.size = newBeforeSize;
    beforePanel.isCollapsed = beforePanel.collapsible && newBeforeSize <= 0;
    afterPanel.size = newAfterSize;
    afterPanel.isCollapsed = afterPanel.collapsible && newAfterSize <= 0;
    
    // 处理交叉点的其他 group
    globalStore.groups.forEach((g, gid) => {
      if (gid !== groupId && g.isDragging && g.dragHandleIndex !== -1) {
        // 更新交叉点 group 的面板大小
        const crossHandle = g.handles.find(h => h.index === g.dragHandleIndex);
        if (crossHandle) {
          const crossBefore = g.panels.get(crossHandle.beforePanelId);
          const crossAfter = g.panels.get(crossHandle.afterPanelId);
          if (crossBefore && crossAfter) {
            // 根据主 group 的变化比例调整交叉 group
            const ratio = beforeStartSize > 0 ? newBeforeSize / beforeStartSize : 1;
            crossBefore.size = Math.max(crossBefore.size * ratio, crossBefore.minSize);
            crossAfter.size = Math.max(crossAfter.size / ratio, crossAfter.minSize);
          }
        }
      }
    });
    
    notifySubscribers();
    return;
  }
  
  // 处理 hover
  const hits = findHitHandles(e);
  const newHovered = new Map<string, number>();
  hits.forEach(hit => {
    newHovered.set(hit.groupId, hit.handleIndex);
  });
  
  // 检查是否有变化
  let changed = false;
  if (newHovered.size !== globalStore.hoveredHandles.size) {
    changed = true;
  } else {
    for (const [groupId, handleIndex] of newHovered) {
      if (globalStore.hoveredHandles.get(groupId) !== handleIndex) {
        changed = true;
        break;
      }
    }
  }
  
  if (changed) {
    globalStore.hoveredHandles = newHovered;
    notifySubscribers();
  }
}

// 全局 pointer up 处理
function handleGlobalPointerUp() {
  if (globalStore.dragState) {
    // 重置所有 group 的拖拽状态
    globalStore.groups.forEach(g => {
      g.isDragging = false;
      g.dragHandleIndex = -1;
    });
    globalStore.dragState = null;
    notifySubscribers();
    document.body.style.userSelect = "";
  }
}

// ============ React Context ============

export const ResizableContext = createContext<ResizableGroupContextValue | null>(null);

export function useResizableContext() {
  const context = useContext(ResizableContext);
  if (!context) {
    throw new Error("useResizableContext must be used within ResizableGroup");
  }
  return context;
}

// Hook for global store subscription
function useGlobalStore() {
  return useSyncExternalStore(
    subscribeToGlobalStore,
    () => globalStore,
    () => globalStore
  );
}

// Hook for group state
export function useResizableGroupState(
  id: string, 
  orientation: Orientation, 
  containerRef: React.RefObject<HTMLElement | null>
) {
  const store = useGlobalStore();
  const groupState = store.groups.get(id);
  
  // Local refs for panels
  const panelsRef = useRef<Map<string, PanelData>>(new Map());
  const handlesRef = useRef<HandleInfo[]>([]);
  
  // Register group on mount
  useEffect(() => {
    const group: GroupState = {
      id,
      orientation,
      containerRef,
      panels: panelsRef.current,
      handles: handlesRef.current,
      isDragging: false,
      dragHandleIndex: -1,
    };
    globalStore.groups.set(id, group);
    notifySubscribers();
    
    return () => {
      globalStore.groups.delete(id);
      notifySubscribers();
    };
  }, [id, orientation, containerRef]);
  
  // Update orientation if changed
  useEffect(() => {
    const group = globalStore.groups.get(id);
    if (group) {
      group.orientation = orientation;
    }
  }, [id, orientation]);
  
  // Register global events on mount (only once)
  useEffect(() => {
    // Check if already registered
    if ((globalStore as any)._eventsRegistered) return;
    (globalStore as any)._eventsRegistered = true;
    
    document.addEventListener("pointerdown", handleGlobalPointerDown);
    document.addEventListener("pointermove", handleGlobalPointerMove);
    document.addEventListener("pointerup", handleGlobalPointerUp);
    
    return () => {
      document.removeEventListener("pointerdown", handleGlobalPointerDown);
      document.removeEventListener("pointermove", handleGlobalPointerMove);
      document.removeEventListener("pointerup", handleGlobalPointerUp);
      (globalStore as any)._eventsRegistered = false;
    };
  }, []);

  const registerPanel = useCallback((panelId: string, panel: PanelData) => {
    panelsRef.current.set(panelId, panel);
    const group = globalStore.groups.get(id);
    if (group) {
      notifySubscribers();
    }
  }, [id]);

  const unregisterPanel = useCallback((panelId: string) => {
    panelsRef.current.delete(panelId);
    notifySubscribers();
  }, [id]);

  const getPanelSize = useCallback((panelId: string) => {
    return panelsRef.current.get(panelId)?.size ?? 0;
  }, []);

  const updatePanelSize = useCallback((panelId: string, size: number) => {
    const panel = panelsRef.current.get(panelId);
    if (panel) {
      panel.size = size;
      panel.isCollapsed = panel.collapsible && size <= 0;
      notifySubscribers();
    }
  }, []);

  const registerHandle = useCallback((index: number, beforePanelId: string, afterPanelId: string) => {
    // Check if handle already exists
    const existingIndex = handlesRef.current.findIndex(h => h.index === index);
    if (existingIndex !== -1) {
      handlesRef.current[existingIndex] = { index, beforePanelId, afterPanelId, position: 0 };
    } else {
      handlesRef.current.push({ index, beforePanelId, afterPanelId, position: 0 });
      handlesRef.current.sort((a, b) => a.index - b.index);
    }
    
    const group = globalStore.groups.get(id);
    if (group) {
      group.handles = handlesRef.current;
    }
  }, [id]);

  const updateHandlePositions = useCallback(() => {
    const group = globalStore.groups.get(id);
    if (group) {
      updateGroupHandlePositions(group);
    }
  }, [id]);

  const findHandleAtPosition = useCallback((pointerPosition: number): number => {
    const container = containerRef.current;
    const group = globalStore.groups.get(id);
    if (!container || !group) return -1;
    
    const rect = getContainerRect(container);
    const containerStart = getContainerStart(rect, group.orientation);
    const relativePos = pointerPosition - containerStart;
    
    updateGroupHandlePositions(group);
    
    for (const handle of group.handles) {
      const distance = Math.abs(handle.position - relativePos);
      if (distance < 4) {
        return handle.index;
      }
    }
    return -1;
  }, [id, containerRef]);

  const getHandlePanels = useCallback((handleIndex: number) => {
    const handle = handlesRef.current.find(h => h.index === handleIndex);
    if (!handle) return { before: null, after: null };
    return { before: handle.beforePanelId, after: handle.afterPanelId };
  }, []);

  const setCollapse = useCallback((panelId: string, collapse: boolean) => {
    const group = globalStore.groups.get(id);
    const panel = panelsRef.current.get(panelId);
    if (!panel || !panel.collapsible || !group) return;

    if (group.maximizedPanel && group.maximizedPanel !== panelId) {
      const maxPanel = panelsRef.current.get(group.maximizedPanel);
      if (maxPanel && maxPanel.isMaximized) {
        panelsRef.current.forEach((p, pid) => {
          if (pid !== group.maximizedPanel && maxPanel.openSizes?.[pid] !== undefined) {
            p.size = maxPanel.openSizes[pid];
            p.isCollapsed = p.size <= 0;
          }
        });
        maxPanel.size = maxPanel.openSize ?? maxPanel.defaultSize;
        maxPanel.isMaximized = false;
        maxPanel.openSizes = undefined;
      }
      group.maximizedPanel = undefined;
    }

    if (collapse && !panel.isCollapsed) {
      panel.openSize = panel.size;
      panel.size = 0;
      panel.isCollapsed = true;
    } else if (!collapse && panel.isCollapsed) {
      panel.size = panel.openSize ?? panel.defaultSize;
      panel.isCollapsed = false;
    }
    notifySubscribers();
  }, [id]);

  const setMaximize = useCallback((panelId: string, maximize: boolean) => {
    const group = globalStore.groups.get(id);
    const panel = panelsRef.current.get(panelId);
    if (!panel || !panel.okMaximize || !group) return;

    const container = containerRef.current;
    if (!container) return;

    const currentMaxId = group.maximizedPanel;

    if (currentMaxId && currentMaxId !== panelId) {
      const currentMaxPanel = panelsRef.current.get(currentMaxId);
      if (currentMaxPanel && currentMaxPanel.isMaximized && currentMaxPanel.openSizes) {
        panelsRef.current.forEach((p, pid) => {
          if (pid !== currentMaxId && currentMaxPanel.openSizes![pid] !== undefined) {
            p.size = currentMaxPanel.openSizes![pid];
            p.isCollapsed = p.size <= 0;
          }
        });
        currentMaxPanel.size = currentMaxPanel.openSize ?? currentMaxPanel.defaultSize;
        currentMaxPanel.isMaximized = false;
        currentMaxPanel.openSizes = undefined;
      }
    }

    if (!maximize && panel.isMaximized) {
      if (panel.openSizes) {
        panelsRef.current.forEach((p, pid) => {
          if (pid !== panelId && panel.openSizes![pid] !== undefined) {
            p.size = panel.openSizes![pid];
            p.isCollapsed = p.size <= 0;
          }
        });
      }
      panel.size = panel.openSize ?? panel.defaultSize;
      panel.isMaximized = false;
      panel.openSizes = undefined;
      group.maximizedPanel = undefined;
    } else if (maximize && !panel.isMaximized) {
      panelsRef.current.forEach((p) => {
        if (p.isCollapsed) {
          p.isCollapsed = false;
          p.size = p.openSize ?? p.defaultSize;
        }
      });

      const rect = getContainerRect(container);
      const groupSize = getContainerSize(rect, group.orientation);
      const openSizes: Record<string, number> = {};

      let otherPanelsMinTotal = 0;
      panelsRef.current.forEach((p, pid) => {
        openSizes[pid] = p.size;
        if (pid !== panelId) {
          otherPanelsMinTotal += p.minSize;
        }
      });

      panel.openSizes = openSizes;
      panel.openSize = panel.size;
      panel.size = Math.max(groupSize - otherPanelsMinTotal, panel.minSize);
      panel.isMaximized = true;
      group.maximizedPanel = panelId;

      panelsRef.current.forEach((p, pid) => {
        if (pid !== panelId) {
          p.size = p.minSize;
        }
      });
    }
    notifySubscribers();
  }, [id, containerRef]);

  const startDragging = useCallback((handleIndex: number) => {
    // 由全局事件处理器处理
  }, []);

  const updateDrag = useCallback((pointerPosition: number) => {
    // 由全局事件处理器处理
  }, []);

  const setDragStartPointer = useCallback((pointerPosition: number) => {
    // 由全局事件处理器处理
  }, []);

  const stopDragging = useCallback(() => {
    // 由全局事件处理器处理
  }, []);

  const registerSizeChangeCallback = useCallback((callback: () => void) => {
    return subscribeToGlobalStore(callback);
  }, []);

  const setHoveredHandle = useCallback((index: number) => {
    if (index === -1) {
      globalStore.hoveredHandles.delete(id);
    } else {
      globalStore.hoveredHandles.set(id, index);
    }
    notifySubscribers();
  }, [id]);

  // Get current state from store
  const currentGroup = store.groups.get(id);
  const isDragging = currentGroup?.isDragging ?? false;
  const dragHandleIndex = currentGroup?.dragHandleIndex ?? -1;
  const maximizedPanel = currentGroup?.maximizedPanel;
  const hoveredHandleIndex = store.hoveredHandles.get(id) ?? -1;

  return {
    id,
    orientation,
    panels: panelsRef.current,
    registerPanel,
    unregisterPanel,
    getPanelSize,
    updatePanelSize,
    setCollapse,
    setMaximize,
    startDragging,
    updateDrag,
    setDragStartPointer,
    stopDragging,
    isDragging,
    dragHandleIndex,
    maximizedPanel,
    registerSizeChangeCallback,
    registerHandle,
    updateHandlePositions,
    findHandleAtPosition,
    getHandlePanels,
    hoveredHandleIndex,
    setHoveredHandle,
  };
}
