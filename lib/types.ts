import { ReactNode } from "react";

export type Orientation = "horizontal" | "vertical";

export interface PanelData {
  id: string;
  size: number; // 当前大小（像素或百分比）
  minSize?: number; // 最小大小（像素）
  defaultSize?: number; // 默认大小
  collapsible?: boolean; // 是否可折叠
  collapsedSize?: number; // 折叠后的大小，默认 0
  isCollapsed?: boolean; // 当前是否折叠
  prevSize?: number; // 折叠前的大小，用于恢复
  maximizable?: boolean; // 是否可最大化
  isMaximized?: boolean; // 当前是否最大化
  prevSizes?: Record<string, number>; // 最大化前所有面板的大小快照
}

export interface ResizableGroupContextValue {
  orientation: Orientation;
  panels: Map<string, PanelData>;
  registerPanel: (id: string, panel: PanelData) => void;
  unregisterPanel: (id: string) => void;
  updatePanelSize: (id: string, size: number) => void;
  toggleCollapse: (id: string) => void;
  toggleMaximize: (id: string) => void;
  getPanelSize: (id: string) => number;
  startDragging: (handleIndex: number) => void;
  stopDragging: () => void;
  isDragging: boolean;
  dragHandleIndex: number;
  maximizedPanelId: string | null;
}

export interface ResizableGroupProps {
  children: ReactNode;
  orientation?: Orientation;
  className?: string;
  onLayoutChange?: (sizes: Record<string, number>) => void;
}

export interface ResizablePanelProps {
  children: ReactNode;
  id: string;
  defaultSize?: number;
  minSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  maximizable?: boolean; // 是否可最大化
  className?: string;
}

export interface ResizableHandleProps {
  className?: string;
  /**
   * 是否显示折叠按钮
   */
  showCollapseButton?: boolean;
  collapseButtonClassName?: string;
  /**
   * 点击折叠按钮时折叠哪一侧的面板
   * "before" | "after" 分别表示折叠手柄前或后的面板
   */
  collapseTarget?: "before" | "after";
  /**
   * 是否显示最大化按钮
   */
  showMaximizeButton?: boolean;
  maximizeButtonClassName?: string;
  /**
   * 点击最大化按钮时最大化哪一侧的面板
   */
  maximizeTarget?: "before" | "after";
  /**
   * @deprecated 已移除，请使用 data-resizable-hit-area 选择器
   */
  hitAreaClassName?: string;
}
