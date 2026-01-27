import type { ReactNode } from 'react';
export declare let inkClear: (() => void) | null;
export declare let inkUnmount: (() => void) | null;
export declare let inkRerender: ((node: ReactNode) => void) | null;
export declare function setInkInstance(instance: {
    clear: () => void;
    unmount: () => void;
    rerender: (node: ReactNode) => void;
}): void;
//# sourceMappingURL=inkInstance.d.ts.map