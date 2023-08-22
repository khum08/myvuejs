import observe from "./observe/";

export default function initState(vm) {
  const { data } = vm.$options;
  if (data) {
    initData(vm);
  }
}

function proxy(target, sourceKey, key) {
  Object.keys(target[sourceKey]).forEach((key) => {
    Object.defineProperty(target, key, {
      get() {
        return target[sourceKey][key];
      },
      set(newValue) {
        target[sourceKey][key] = newValue;
      },
    });
  });
}

function initData(vm) {
  let data = vm.$options.data;
  data = typeof data === "function" ? data.call(vm) : data;
  //   console.log(data);
  vm._data = data;
  observe(data);
  proxy(vm, "_data", data);
}
