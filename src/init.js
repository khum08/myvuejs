import initState from "./state";

export default function initMixins(Vue) {
  Vue.prototype._init = function (options) {
    // console.log("init", options);
    const vm = this;
    Vue.$vm = vm;
    vm.$options = options;
    initState(vm);
  };
}
