export function vnode(tag, data, key, children, text, vm) {
  return {
    tag,
    data,
    key,
    children,
    text,
    vm,
  };
}

export function createTextVnode(text) {
  return vnode(undefined, undefined, undefined, undefined, text);
}

export function createElementVNode(tag, data = {}, ...children) {
  if (data == null) data = {};
  return vnode(tag, data, data.key || "", children);
}
