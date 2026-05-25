import type {
  RyunixElement,
  RyunixElementType,
  RyunixNode,
} from '../types/index'

export function jsx(
  type: RyunixElementType,
  props: Record<string, unknown> | null | undefined,
  key?: string,
): RyunixElement

export function jsxs(
  type: RyunixElementType,
  props: Record<string, unknown> | null | undefined,
  key?: string,
): RyunixElement

export function jsxDEV(
  type: RyunixElementType,
  props: Record<string, unknown> | null | undefined,
  key?: string,
): RyunixElement

export function Fragment(props: {
  children?: RyunixNode | RyunixNode[]
}): RyunixElement

export namespace JSX {
  type Element = RyunixElement
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>
  }
}
