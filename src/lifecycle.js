import Watcher from "./observe/watcher";
import { createElementVNode, createTextVnode } from "./vdom";

export function mountComponent(vm, el) {
  // console.log(vm._render());
  // vm._update(vm._render());
  const updateComponent = () => {
    console.log("===== updateComponent =====");
    vm._update(vm._render());
  };

  new Watcher(vm, updateComponent, () => {});
}

export function patch(oldVnode, vnode) {
  const isRealElement = oldVnode.nodeType;
  if (isRealElement) {
    const oldElm = oldVnode;
    const parentElm = oldElm.parentNode;
    let el = createElm(vnode);
    parentElm.insertBefore(el, oldElm.nextSibling);
    parentElm.removeChild(oldElm);
    return el;
  }
}

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this;
    vm.$el = patch(vm.$el, vnode);
  };
  Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    const vnode = render.call(vm);
    return vnode;
  };

  Vue.prototype._c = function (...args) {
    return createElementVNode(...args);
  };
  Vue.prototype._v = function (text) {
    return createTextVnode(text);
  };
  Vue.prototype._s = function (val) {
    return val == null
      ? ""
      : typeof val === "object"
      ? JSON.stringify(val)
      : val;
  };
}

export function createElm(vnode) {
  const { tag, data, children, text, vm } = vnode;
  if (typeof tag === "string") {
    vnode.el = document.createElement(tag);
    // updateProperties(vnode);
    if (data) {
      Object.keys(data).forEach((key) => {
        if (key === "style") {
          Object.keys(data[key]).forEach((styleKey) => {
            vnode.el.style[styleKey] = data[key][styleKey];
          });
        } else {
          vnode.el.setAttribute(key, data[key]);
        }
      });
    }
    children.forEach((child) => {
      vnode.el.appendChild(createElm(child));
    });
  } else {
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}
