[EN](README.md) | [中文](#)

# Resizable Panels

一个用于构建类 IDE 布局（类似 VSCode）的 Headless React 组件库。

## 特性

- **尺寸** - 支持像素（px）和比例（ratio）两种尺寸模式
- **约束** - 支持最大/最小像素约束
- **可折叠** - 面板支持折叠展开操作
- **最大化** - 面板支持最大化操作
- **持久化** - 保存和恢复布局状态

## 安装

首先在本仓库构建：

```bash
cd /path/to/resizable-panels
```

```bash
pnpm install && pnpm build
```

然后在你的项目中添加依赖：

```json
{
  "dependencies": {
    "@local/resizable-panels": "link:/absolute/path/to/resizable-panels"
  }
}
```

最后在你的项目中安装：

```bash
cd /path/to/your-project
```

```bash
pnpm install
```

## 开发

本项目使用 pnpm workspaces。要运行示例：

```bash
pnpm install
```

```bash
pnpm dev
```

如果你需要去除日志信息, 运行以下指令:

```bash
pnpm dev:minify
```

**注意**：请勿在 `example` 目录下运行 `pnpm install`。

> 由于 workspace 配置，必须从项目根目录运行。

## 快速开始

```tsx
import { ResizableContext, ResizableGroup, ResizablePanel, ResizableHandle } from '@local/resizable-panels';

function App() {
  return (
    <ResizableContext className="h-screen">
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
  id?: string;                                          // 唯一标识符
  children?: ReactNode;                                 // 子元素
  className?: string;                                   // CSS 类名
  onContextMount?: (context: ContextValue) => void;     // 上下文挂载回调 - 用于加载保存的布局
  onStateChanged?: (context: ContextValue) => void;     // 状态变化回调 - 用于保存变化的布局
}
```

### ResizableGroup

用于在同一方向分组面板的容器。

```tsx
interface ResizableGroupProps {
  id?: string;                  // 唯一标识符
  children?: ReactNode;         // 子元素（ResizablePanels）
  className?: string;           // CSS 类名
  direction?: 'row' | 'col';    // 调整大小方向（默认：'col'）
                                // 'col' = 面板水平排列（左右布局），拖拽手柄水平调整大小
                                // 'row' = 面板垂直排列（上下布局），拖拽手柄垂直调整大小
  ratio?: boolean;              // 使用比例模式的弹性布局（默认：false）
                                // 为 true 时，面板尺寸作为 flex-grow 比例使用
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
  collapsed?: boolean;            // 默认折叠状态（默认：false）
  okMaximize?: boolean;           // 允许最大化（默认：false）
}
```

### ResizableHandle

面板之间的拖拽手柄，用于在面板间显示视觉分隔线。

**注意：Handle 的索引（index）按照声明顺序绑定，而非 DOM 位置。**

```tsx
interface ResizableHandleProps {
  className?: string;             // CSS 类名
  children?: ReactNode;           // 自定义内容，如图标
  onClick?: () => void;           // 单击回调
  onDoubleClick?: () => void;     // 双击回调
}
```

## Hooks

### useResizableContext

在 `ResizableContext` 外部访问根上下文值：

```tsx
import { useResizableContext, fromJson } from '@local/resizable-panels';

function GlobalControls() {
  const context = useResizableContext();
  
  // 访问所有分组
  const groups = [...context.groups.values()];
  
  // 保存状态到 localStorage
  const handleSave = () => {
    const saved = context.getState();
    localStorage.setItem('layout', JSON.stringify(saved));
  };
  
  // 从 localStorage 加载状态
  const handleLoad = () => {
    const json = localStorage.getItem('layout');
    const state = fromJson(json);
    if (state) {
      context.setState(state);
    }
  };
  
  return <div>全局控制</div>;
}
```

#### subscribe

订阅布局变化事件。当你需要在子组件监听布局变化，这个方法非常有用。

```tsx
const context = useResizableContext();

// 订阅布局变化
const unsubscribe = context.subscribe((ctx) => {
  // ...
});

// 当不再需要监听时，取消订阅
unsubscribe();
```

**参数：**

- `callback`: 布局变化时调用的函数，接收 `ContextValue` 作为参数。

**返回值：**

- `unsubscribe`: 用于取消订阅布局变化的函数。

### useGroupContext

在 `ResizableGroup` 内部访问组上下文以编程方式控制面板：

```tsx
import { useGroupContext } from '@local/resizable-panels';

function CustomComponent() {
  const group = useGroupContext();
  
  // 访问面板和组属性
  const panels = [...group.panels.values()];
}
```

### usePanelContext

在 `ResizablePanel` 内部访问面板上下文：

```tsx
import { usePanelContext } from '@local/resizable-panels';

function PanelContent() {
  const panel = usePanelContext();
  
  // 访问面板属性
  const { size, minSize, maxSize, isCollapsed, isMaximized } = panel;
  
  return <div>面板大小: {size}px</div>;
}
```

## 工具函数

### dragHandle

在特定 handle 索引处编程方式调整面板大小。通过 `GroupValue` 调用。

```tsx
const group = useGroupContext();

// 将左侧面板展开 200px（handle 索引 0）
group.dragHandle(200, 0);

// 折叠右侧面板（handle 索引 1）
const panel = [...group.panels.values()][1];
group.dragHandle(-panel.size, 1);
```

**参数：**

- `delta`：移动的像素值（正数 = handle 前的面板增长，负数 = 收缩）
- `index`：Handle 索引（0 = 面板 0 和 1 之间）

### restorePanels

将所有面板恢复到最大化前的状态。

```tsx
const group = useGroupContext();
group.restorePanels();
```

### maximizePanel

通过折叠其他所有面板来最大化指定面板。

```tsx
const group = useGroupContext();
group.maximizePanel(targetId);
```

### toggleMaximize

切换指定面板的最大化/恢复状态。如果有面板当前处于最大化状态，则恢复所有面板；否则最大化指定面板。

```tsx
const group = useGroupContext();
const panel = usePanelContext();

// 点击按钮时切换最大化/恢复
<button onClick={() => group.toggleMaximize(panel.id)}>
  {panel.isMaximized ? '恢复' : '最大化'}
</button>
```

### 布局持久化函数

#### getState

将所有分组的当前状态保存为 Record 对象。

```tsx
const context = useResizableContext();
const savedState = context.getState();
localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(savedState));
```

#### setState

将加载的状态应用到所有分组。

```tsx
const context = useResizableContext();
context.setState(fromJson(json));
```

#### fromJson

从 JSON 字符串加载并验证状态。如果无效则返回 `null`。

```tsx
import { fromJson } from '@local/resizable-panels';

const json = localStorage.getItem(LAYOUT_STORAGE_KEY);
context.setState(fromJson(json));
```

## 高级示例

### 比例模式

使用 `ratio` 模式实现基于比例的空间分配。面板尺寸将作为 flex-grow 比例而非固定像素：

```tsx
<ResizableGroup direction="col" ratio>
  <ResizablePanel defaultSize={1}>  {/* 占用 1/4 空间 */}
    侧边栏
  </ResizablePanel>
  <ResizablePanel defaultSize={3}>  {/* 占用 3/4 空间 */}
    主内容区
  </ResizablePanel>
</ResizableGroup>
```

在比例模式下，拖拽调整大小仍然可用，空间会按比例分配。

### 嵌套布局

通过嵌套分组创建复杂布局：

```tsx
<ResizableContext className="h-screen">
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

### 默认折叠

设置 `collapsed={true}` 使面板初始处于折叠状态（需同时设置 `collapsible`）：

```tsx
<ResizableGroup direction="col">
  <ResizablePanel defaultSize={250} minSize={200} collapsible collapsed>
    默认折叠的侧边栏
  </ResizablePanel>
  <ResizablePanel>
    主内容区
  </ResizablePanel>
</ResizableGroup>
```

### 状态变化回调

监听调整大小结束时的状态变化：

```tsx
<ResizableContext 
  onStateChanged={(context) => {
    // 保存状态到 localStorage
    const state = context.getState();
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
  }}
>
</ResizableContext>
```

### 上下文挂载回调

在 Context 挂载时调用，可用于恢复之前保存的状态数据：

```tsx
<ResizableContext 
  onContextMount={(context) => {
    // 从 localStorage 加载状态
    const json = localStorage.getItem(LAYOUT_STORAGE_KEY);
    context.setState(fromJson(json));
  }}
>
</ResizableContext>
```

### 编程方式控制面板

使用 `useGroupContext` 和工具函数创建自定义面板控制：

```tsx
function PanelControls() {
  const group = useGroupContext();
  const panels = [...group.panels.values()];
  const leftPanel = panels[0];

  return (
    <div>
      <button onClick={() => group.dragHandle(100, 0)}>
        展开左侧
      </button>
      <button onClick={() => group.toggleMaximize(leftPanel.id)}>
        切换最大化
      </button>
      <button onClick={() => group.restorePanels()}>
        恢复所有
      </button>
    </div>
  );
}
```

## 许可证

MIT
