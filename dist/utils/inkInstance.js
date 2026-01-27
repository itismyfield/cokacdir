export let inkClear = null;
export let inkUnmount = null;
export let inkRerender = null;
export function setInkInstance(instance) {
    inkClear = instance.clear;
    inkUnmount = instance.unmount;
    inkRerender = instance.rerender;
}
//# sourceMappingURL=inkInstance.js.map