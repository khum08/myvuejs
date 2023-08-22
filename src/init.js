import compileToFunction from "./compiler";
import { mountComponent } from "./lifecycle";
import initState from "./state";

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    // console.log("init", options);
    const vm = this;
    Vue.$vm = vm;
    vm.$options = options;
    initState(vm);

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };

  Vue.prototype.$mount = function (el) {
    let vm = this;
    el = document.querySelector(el);
    vm.$el = el;
    let template = vm.$options.template;
    if (!vm.$options.render) {
      if (!template && el) {
        template = el.outerHTML;
      }
      //   console.log("rendering template", template);
      if (template) {
        const render = compileToFunction(template);
        vm.$options.render = render;
      }
    }

    mountComponent(vm, el);
  };
}
