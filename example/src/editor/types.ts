import { ReactNode } from "react"

export interface Tab {
  id: string
  name: string
  language: string
  iconColor: string
  content: string[]
}

export type SplitDirection = "horizontal" | "vertical"

export interface EditorGroup {
  id: string
  tabs: Tab[]
  activeTabId: string
}

export interface SplitNode<T = EditorGroup> {
  id: string
  direction: SplitDirection
  children: (SplitNode<T> | T)[]
  sizes: number[]
}

// 通用视图节点类型 - 可以是 EditorGroup 或任意自定义数据
export interface ViewNode<T = unknown> {
  id: string
  data: T
  title?: string
}

// 通用分屏树类型
export type SplitTree<T> = SplitNode<T> | T

// 渲染函数类型
export type RenderLeafFn<T> = (props: {
  data: T
  onUpdate: (data: T) => void
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  canClose: boolean
}) => ReactNode
