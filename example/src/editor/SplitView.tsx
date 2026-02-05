import { ReactNode, useCallback } from "react"
import { ResizableGroup, ResizablePanel } from "@local/resizable-panels"
import ResizeHandle from "../ui/resize-handle"
import { SplitNode, SplitTree, SplitDirection, RenderLeafFn } from "./types"
import { isSplitNode, generateId } from "./utils"

export interface SplitViewProps<T> {
  tree: SplitTree<T>
  /** 渲染叶子节点的函数 */
  renderLeaf: RenderLeafFn<T>
  /** 当树结构变化时的回调 */
  onUpdate: (tree: SplitTree<T>) => void
  /** 关闭当前节点的回调 */
  onClose: () => void
  /** 是否可以关闭（当只有一个节点时通常不能关闭） */
  canClose: boolean
  /** 创建新节点的工厂函数（用于分屏时创建新节点） */
  createNode?: (originalData: T) => T
}

/**
 * 通用分屏视图组件
 */
export const SplitView = <T extends { id: string }>({
  tree,
  renderLeaf,
  onUpdate,
  onClose,
  canClose,
  createNode,
}: SplitViewProps<T>): ReactNode => {
  // 渲染叶子节点
  if (!isSplitNode(tree)) {
    const data = tree

    const handleSplit = (direction: SplitDirection) => {
      if (!createNode) return

      const newNode = createNode(data)
      const splitNode: SplitNode<T> = {
        id: generateId(),
        direction,
        children: direction === "horizontal" ? [data, newNode] : [data, newNode],
        sizes: [50, 50],
      }
      onUpdate(splitNode)
    }

    return (
      <>
        {renderLeaf({
          data,
          onUpdate: (newData) => onUpdate(newData),
          onSplit: handleSplit,
          onClose,
          canClose,
        })}
      </>
    )
  }

  const direction = tree.direction === "horizontal" ? "col" : "row"
  const childrenCount = tree.children.length

  // 使用 useCallback 确保 onUpdate 回调稳定
  const handleChildUpdate = useCallback((index: number, newChild: SplitTree<T>) => {
    const newChildren = [...tree.children]
    newChildren[index] = newChild
    onUpdate({ ...tree, children: newChildren })
  }, [tree, onUpdate])

  const handleChildClose = useCallback((index: number) => {
    const newChildren = tree.children.filter((_, i) => i !== index)
    if (newChildren.length === 1) {
      // 如果只剩一个子节点，直接提升该子节点替换父节点
      onUpdate(newChildren[0])
    } else {
      // 否则更新父节点的 children
      onUpdate({ ...tree, children: newChildren, sizes: tree.sizes.slice(0, newChildren.length) })
    }
  }, [tree, onUpdate])

  return (
    <ResizableGroup id={`group-${tree.id}`} direction={direction} ratio>
      {tree.children.map((child, index) => {
        const childCanClose = childrenCount > 1
        
        return (
          <ChildView
            key={(child as { id: string }).id}
            child={child}
            index={index}
            renderLeaf={renderLeaf}
            onUpdate={(newChild) => handleChildUpdate(index, newChild)}
            onClose={() => handleChildClose(index)}
            canClose={childCanClose}
            createNode={createNode}
          />
        )
      })}
    </ResizableGroup>
  )
}

interface ChildViewProps<T> {
  child: SplitTree<T>
  index: number
  renderLeaf: RenderLeafFn<T>
  onUpdate: (child: SplitTree<T>) => void
  onClose: () => void
  canClose: boolean
  createNode?: (originalData: T) => T
}

const ChildView = <T extends { id: string }>({
  child,
  index,
  renderLeaf,
  onUpdate,
  onClose,
  canClose,
  createNode,
}: ChildViewProps<T>): ReactNode => {
  return (
    <>
      {index > 0 && <ResizeHandle />}
      <ResizablePanel id={`panel-${(child as { id: string }).id}`} className="min-w-0 border-l">
        <SplitView
          tree={child}
          renderLeaf={renderLeaf}
          onUpdate={onUpdate}
          onClose={onClose}
          canClose={canClose}
          createNode={createNode}
        />
      </ResizablePanel>
    </>
  )
}
