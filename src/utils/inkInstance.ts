// Ink 인스턴스 관리 모듈
import type { ReactNode } from 'react';

export let inkClear: (() => void) | null = null;
export let inkUnmount: (() => void) | null = null;
export let inkRerender: ((node: ReactNode) => void) | null = null;

export function setInkInstance(instance: {
  clear: () => void;
  unmount: () => void;
  rerender: (node: ReactNode) => void;
}) {
  inkClear = instance.clear;
  inkUnmount = instance.unmount;
  inkRerender = instance.rerender;
}
