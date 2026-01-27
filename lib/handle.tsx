"use client";

import { useEffect, useRef } from "react";
import { useResizableContext } from "./context";
import type { ResizableHandleProps } from "./types";

export function ResizableHandle({
  className = "",
}: ResizableHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const context = useResizableContext();

  // 注册 handle 到 context
  useEffect(() => {
    const container = handleRef.current?.parentElement;
    if (!container) return;

    // 找到自己在所有 handle 中的索引
    const allElements = Array.from(container.children);
    const handles = allElements.filter(el => el.hasAttribute("data-resizable-handle"));
    const index = handles.indexOf(handleRef.current!);
    
    if (index === -1) return;

    // 找到前面的面板（往前查找）
    let beforePanelId: string | null = null;
    for (let i = allElements.indexOf(handleRef.current!) - 1; i >= 0; i--) {
      const el = allElements[i];
      if (el.hasAttribute("data-resizable-panel")) {
        beforePanelId = el.getAttribute("data-panel-id");
        break;
      }
    }

    // 找到后面的面板（往后查找）
    let afterPanelId: string | null = null;
    for (let i = allElements.indexOf(handleRef.current!) + 1; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.hasAttribute("data-resizable-panel")) {
        afterPanelId = el.getAttribute("data-panel-id");
        break;
      }
    }

    if (beforePanelId && afterPanelId) {
      context.registerHandle(index, beforePanelId, afterPanelId);
      // 更新 handle 位置
      setTimeout(() => context.updateHandlePositions(), 0);
    }
  }, [context]);

  // 当 panel 大小变化时，更新 handle 位置
  useEffect(() => {
    const unsubscribe = context.registerSizeChangeCallback(() => {
      context.updateHandlePositions();
    });
    return unsubscribe;
  }, [context]);

  const isHorizontal = context.orientation === "horizontal";
  const isHovered = context.hoveredHandleIndex !== -1;
  const isDragging = context.isDragging;

  // 获取 handle 索引
  const handleIndex = (() => {
    const container = handleRef.current?.parentElement;
    if (!container) return -1;
    const allElements = Array.from(container.children);
    const handles = allElements.filter(el => el.hasAttribute("data-resizable-handle"));
    return handles.indexOf(handleRef.current!);
  })();

  const isThisHovered = context.hoveredHandleIndex === handleIndex;
  const isThisDragging = context.dragHandleIndex === handleIndex && context.isDragging;

  return (
    <div
      ref={handleRef}
      data-resizable-handle
      data-handle-index={handleIndex}
      data-dragging={isThisDragging}
      data-hover={isThisHovered}
      data-orientation={isHorizontal ? "vertical" : "horizontal"}
      className={className}
      style={{
        flexShrink: 0,
        pointerEvents: "none",
        userSelect: "none",
        // 0 面积控件
        width: isHorizontal ? 0 : undefined,
        height: isHorizontal ? undefined : 0,
        position: "relative",
      }}
    >
      {/* 视觉指示器 */}
      <div
        data-resizable-handle-indicator
        style={{
          position: "absolute",
          [isHorizontal ? "left" : "top"]: -2,
          [isHorizontal ? "width" : "height"]: 4,
          [isHorizontal ? "height" : "width"]: "100%",
          backgroundColor: isThisDragging 
            ? "#0066cc" 
            : isThisHovered 
              ? "#666" 
              : "transparent",
          transition: "background-color 0.15s",
        }}
      />
    </div>
  );
}
