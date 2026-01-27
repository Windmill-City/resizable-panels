"use client";

import { useRef, useCallback, useState } from "react";
import { useResizableContext } from "./context";
import type { ResizableHandleProps } from "./types";

export function ResizableHandle({
  className = "",
  collapseButtonClassName = "",
  maximizeButtonClassName = "",
  showCollapseButton = false,
  showMaximizeButton = false,
  collapseTarget = "before",
  maximizeTarget = "before",
}: ResizableHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const context = useResizableContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // 存储拖拽开始时的状态
  const dragStateRef = useRef<{
    startPointer: number;
    beforePanelId: string | null;
    afterPanelId: string | null;
    beforeStartSize: number;
    afterStartSize: number;
  } | null>(null);

  // 获取当前手柄前后的面板
  const getAdjacentPanels = useCallback(() => {
    const container = handleRef.current?.parentElement;
    if (!container) return { before: null, after: null };

    const allElements = Array.from(container.children);
    const handleIndex = allElements.findIndex(el => el === handleRef.current);
    
    if (handleIndex === -1) return { before: null, after: null };

    let beforePanel: Element | null = null;
    let afterPanel: Element | null = null;

    for (let i = handleIndex - 1; i >= 0; i--) {
      const el = allElements[i];
      if (el.hasAttribute("data-resizable-panel")) {
        beforePanel = el;
        break;
      }
    }

    for (let i = handleIndex + 1; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.hasAttribute("data-resizable-panel")) {
        afterPanel = el;
        break;
      }
    }

    return {
      before: beforePanel?.getAttribute("data-panel-id") ?? null,
      after: afterPanel?.getAttribute("data-panel-id") ?? null,
    };
  }, []);

  // 处理指针按下（开始拖拽）
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const { before, after } = getAdjacentPanels();
    
    if (!before || !after) return;

    const beforePanel = context.panels.get(before);
    const afterPanel = context.panels.get(after);
    
    if (!beforePanel || !afterPanel) return;

    if (beforePanel.isCollapsed || afterPanel.isCollapsed) return;

    const isHorizontal = context.orientation === "horizontal";
    const startPointer = isHorizontal ? e.clientX : e.clientY;

    dragStateRef.current = {
      startPointer,
      beforePanelId: before,
      afterPanelId: after,
      beforeStartSize: beforePanel.size,
      afterStartSize: afterPanel.size,
    };

    setIsDragging(true);
    context.startDragging(0);

    handleRef.current?.setPointerCapture(e.pointerId);
  }, [context, getAdjacentPanels]);

  // 处理指针移动（拖拽中）
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStateRef.current) return;

    const { 
      startPointer, 
      beforePanelId, 
      afterPanelId, 
      beforeStartSize, 
      afterStartSize 
    } = dragStateRef.current;

    const isHorizontal = context.orientation === "horizontal";
    const currentPointer = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPointer - startPointer;

    const beforePanel = context.panels.get(beforePanelId!);
    const afterPanel = context.panels.get(afterPanelId!);
    
    if (!beforePanel || !afterPanel) return;

    const beforeMin = beforePanel.minSize ?? 0;
    const afterMin = afterPanel.minSize ?? 0;

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

    if (beforePanel.collapsible && newBeforeSize <= (beforePanel.collapsedSize ?? 0) + 5) {
      newBeforeSize = beforePanel.collapsedSize ?? 0;
      newAfterSize = beforeStartSize + afterStartSize - newBeforeSize;
    }
    
    if (afterPanel.collapsible && newAfterSize <= (afterPanel.collapsedSize ?? 0) + 5) {
      newAfterSize = afterPanel.collapsedSize ?? 0;
      newBeforeSize = beforeStartSize + afterStartSize - newAfterSize;
    }

    context.updatePanelSize(beforePanelId!, newBeforeSize);
    context.updatePanelSize(afterPanelId!, newAfterSize);

    // 直接更新 DOM
    const container = handleRef.current?.parentElement;
    if (container) {
      const beforeEl = container.querySelector(`[data-panel-id="${beforePanelId}"]`) as HTMLElement;
      const afterEl = container.querySelector(`[data-panel-id="${afterPanelId}"]`) as HTMLElement;
      
      if (beforeEl) beforeEl.style[isHorizontal ? "width" : "height"] = `${newBeforeSize}px`;
      if (afterEl) afterEl.style[isHorizontal ? "width" : "height"] = `${newAfterSize}px`;
    }
  }, [isDragging, context]);

  // 处理指针释放（结束拖拽）
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    context.stopDragging();
    dragStateRef.current = null;

    handleRef.current?.releasePointerCapture(e.pointerId);
  }, [isDragging, context]);

  // 处理折叠按钮点击
  const handleCollapseClick = useCallback(() => {
    const { before, after } = getAdjacentPanels();
    const targetId = collapseTarget === "before" ? before : after;
    
    if (targetId) {
      context.toggleCollapse(targetId);
    }
  }, [collapseTarget, getAdjacentPanels, context]);

  // 处理最大化按钮点击
  const handleMaximizeClick = useCallback(() => {
    const { before, after } = getAdjacentPanels();
    const targetId = maximizeTarget === "before" ? before : after;
    
    if (targetId) {
      context.toggleMaximize(targetId);
    }
  }, [maximizeTarget, getAdjacentPanels, context]);

  const isHorizontal = context.orientation === "horizontal";
  const hasMaximizedPanel = !!context.maximizedPanelId;

  return (
    <div
      ref={handleRef}
      data-resizable-handle
      data-dragging={isDragging}
      data-hover={isHovered}
      data-orientation={isHorizontal ? "vertical" : "horizontal"}
      data-collapse-target={collapseTarget}
      data-maximize-target={maximizeTarget}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsHovered(false)}
      onPointerEnter={() => setIsHovered(true)}
      style={{
        flexShrink: 0,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* 扩大点击区域 */}
      <div 
        data-resizable-hit-area
        style={{
          position: "absolute",
          [isHorizontal ? "left" : "top"]: -4,
          [isHorizontal ? "right" : "bottom"]: -4,
          [isHorizontal ? "top" : "left"]: 0,
          [isHorizontal ? "bottom" : "right"]: 0,
        }}
      />
      
      {/* 折叠按钮 */}
      {showCollapseButton && (
        <button
          data-collapse-button
          data-target={collapseTarget}
          onClick={handleCollapseClick}
          onPointerDown={(e) => e.stopPropagation()}
          className={collapseButtonClassName}
        >
          {isHorizontal 
            ? (collapseTarget === "before" ? "‹" : "›")
            : (collapseTarget === "before" ? "˄" : "˅")
          }
        </button>
      )}
      
      {/* 最大化按钮 */}
      {showMaximizeButton && (
        <button
          data-maximize-button
          data-target={maximizeTarget}
          data-active={hasMaximizedPanel}
          onClick={handleMaximizeClick}
          onPointerDown={(e) => e.stopPropagation()}
          className={maximizeButtonClassName}
        >
          {hasMaximizedPanel ? "◱" : "□"}
        </button>
      )}
    </div>
  );
}
