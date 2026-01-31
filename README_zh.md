[中文](#) | [EN](README.md)

# Resizable Panels

一个 Headless 的可调整大小面板 React 组件库。基于 TypeScript 构建，为创建可调整大小的界面提供灵活、无样式的基础。

## 特性

- 🎨 **Headless 设计** - 完全控制样式，不强制任何 CSS
- 📐 **灵活布局** - 支持水平（`col`）和垂直（`row`）方向调整大小
- 🗂️ **嵌套分组** - 支持复杂的嵌套布局
- 📏 **智能约束** - 最小/最大尺寸约束，智能空间分配
- 🔄 **可折叠面板** - 面板可以被折叠和展开
- 🔍 **可最大化面板** - 支持最大化面板
- 🌱 **扩展模式** - 容器大小变化时面板可以自动增长/收缩
- ⚡ **高性能** - 高效的调整大小处理，最小化重渲染
- 🔷 **TypeScript** - 完整的类型安全支持

## 安装

```bash
npm install @local/resizable-panels
# 或
pnpm add @local/resizable-panels
# 或
yarn add @local/resizable-panels
```

## 开发

本项目使用 pnpm workspace。要运行示例：

```bash
# 安装依赖
pnpm install

# 启动开发服务器（在项目根目录运行，不要在 example 目录下运行）
pnpm dev
```

> **注意**：请勿在 `example` 目录下运行 `pnpm dev`。由于 workspace 配置，必须从项目根目录启动。

## 快速开始

```tsx
import { ResizableContext, ResizableGroup, ResizablePanel } from '@local/resizable-panels';

function App() {
  return (
    <ResizableContext style={{ height: '100vh' }}>
      <ResizableGroup direction="col">
        <ResizablePanel defaultSize={300} minSize={200}>
          <div style={{ background: '#f0f0f0', height: '100%' }}>
            左侧面板
          </div>
        </ResizablePanel>
        <ResizablePanel defaultSize={500} minSize={300}>
          <div style={{ background: '#e0e0e0', height: '100%' }}>
            右侧面板
          </div>
        </ResizablePanel>
      </ResizableGroup>
    </ResizableContext>
  );
}
```

## 组件

### ResizableContext

根容器，管理所有可调整大小的组并处理全局鼠标事件。

```tsx
interface ResizableContextProps {
  id?: string;                    // 唯一标识符
  children?: ReactNode;           // 子元素
  className?: string;             // CSS 类名
  onLayoutChanged?: (context: ContextValue) => void;  // 布局变化回调
}
```

### ResizableGroup

用于在同一方向分组面板的容器。

```tsx
interface ResizableGroupProps {
  id?: string;                    // 唯一标识符
  children?: ReactNode;           // 子元素（ResizablePanels）
  className?: string;             // CSS 类名
  direction?: 'row' | 'col';      // 调整大小方向（默认：'col'）
                                  // 'col' = 水平调整手柄
                                  // 'row' = 垂直调整手柄
}
```

### ResizablePanel

单个可调整大小的面板。

```tsx
interface ResizablePanelProps {
  id?: string;                    // 唯一标识符
  children?: ReactNode;           // 面板内容
  className?: string;             // CSS 类名
  expand?: boolean;               // 容器大小变化时增长/收缩（默认：false）
  minSize?: number;               // 最小尺寸（像素）（默认：200）
  maxSize?: number;               // 最大尺寸（像素）（默认：Infinity）
  defaultSize?: number;           // 默认尺寸（像素）（默认：300）
  collapsible?: boolean;          // 允许折叠（默认：false）
  okMaximize?: boolean;           // 允许最大化（默认：false）
}
```

## 高级示例

### 嵌套布局

通过嵌套分组创建复杂布局：

```tsx
<ResizableContext style={{ height: '100vh' }}>
  <ResizableGroup direction="col">
    {/* 左侧边栏 */}
    <ResizablePanel defaultSize={250} minSize={150} collapsible>
      侧边栏
    </ResizablePanel>
    
    {/* 主内容区 */}
    <ResizableGroup direction="row">
      {/* 顶部面板 */}
      <ResizablePanel defaultSize={400} minSize={200}>
        顶部内容
      </ResizablePanel>
      
      {/* 底部面板 */}
      <ResizablePanel defaultSize={300} minSize={150} collapsible>
        底部内容
      </ResizablePanel>
    </ResizableGroup>
    
    {/* 右侧面板 */}
    <ResizablePanel defaultSize={300} minSize={200}>
      右侧面板
    </ResizablePanel>
  </ResizableGroup>
</ResizableContext>
```

### 扩展模式

设置 `expand={true}` 的面板将增长以填充可用空间：

```tsx
<ResizableGroup direction="col">
  <ResizablePanel defaultSize={200} minSize={150}>
    固定面板
  </ResizablePanel>
  <ResizablePanel expand minSize={300}>
    此面板会扩展以填充剩余空间
  </ResizablePanel>
</ResizableGroup>
```

### 布局变化回调

监听调整大小结束时的布局变化：

```tsx
<ResizableContext 
  onLayoutChanged={(context) => {
    console.log('布局变化:', context);
    // 保存布局到 localStorage 等
  }}
>
  {/* ... */}
</ResizableContext>
```

## 工作原理

### 调整大小

1. 将鼠标移动到两个面板之间的边缘
2. 光标会变化以指示调整大小手柄
3. 点击并拖动以调整大小
4. 释放以完成

### 折叠

当设置 `collapsible={true}` 时：

- 将面板边缘拖动超过 `minSize` 的一半
- 面板将折叠为 0 大小
- 将边缘拖回以展开面板

### 空间分配

调整大小时：

- 空间首先从最接近调整手柄的面板获取
- 面板遵守 `minSize` 和 `maxSize` 约束
- 折叠的面板不参与空间分配
- 扩展面板增长以填充剩余空间

## 样式

由于这是一个 Headless 库，你拥有完全的样式控制权：

```tsx
<ResizableContext className="my-layout">
  <ResizableGroup direction="col" className="my-group">
    <ResizablePanel 
      className="my-panel sidebar"
      defaultSize={250}
      minSize={150}
      collapsible
    >
      <div className="panel-content">内容</div>
    </ResizablePanel>
    <ResizablePanel className="my-panel main" expand>
      <div className="panel-content">主要内容</div>
    </ResizablePanel>
  </ResizableGroup>
</ResizableContext>
```

### 数据属性

面板暴露数据属性用于样式设置：

```css
[data-resizable-panel] {
  /* 所有面板 */
}

[data-resizable-panel][data-collapsed="true"] {
  /* 已折叠面板 */
}

[data-resizable-panel][data-maximized="true"] {
  /* 已最大化面板 */
}

[data-resizable-group] {
  /* 分组 */
}

[data-resizable-group][data-direction="col"] {
  /* 水平分组 */
}

[data-resizable-group][data-direction="row"] {
  /* 垂直分组 */
}
```

## TypeScript

完整的 TypeScript 支持，导出类型：

```tsx
import type { 
  ResizableContextProps, 
  ResizableGroupProps, 
  ResizablePanelProps,
  ContextValue,
  GroupValue,
  PanelValue,
  Direction
} from '@local/resizable-panels';
```

## 许可证

MIT
