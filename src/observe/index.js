import { arrayMethods } from "./array";

class Observer {
  constructor(data) {
    // console.log("Observer", data);
    Object.defineProperty(data, "__ob__", {
      value: this,
      enumerable: false,
    });
    if (Array.isArray(data)) {
      // 劫持数组
      Object.getOwnPropertyNames(arrayMethods).forEach((key) => {
        Object.defineProperty(data, key, {
          value: arrayMethods[key],
        });
      });
      this.observeArray(data);
    } else {
      this.walk(data);
    }
  }
  walk(data) {
    Object.keys(data).forEach((key) => {
      defineReactive(data, key, data[key]);
    });
  }

  observeArray(data) {
    // console.log("Observer", data);
    data.forEach((item) => {
      //   console.log("Observer", item);
      observe(item);
    });
  }
}

function defineReactive(target, key, value) {
  observe(value);
  Object.defineProperty(target, key, {
    get() {
      console.log("取值::", value);
      return value;
    },
    set(newValue) {
      if (newValue === value) return;
      observe(newValue);
      console.log("设值::", newValue);
      value = newValue;
    },
  });
}

export default function observe(data) {
  if (typeof data !== "object" || data === null) return;
  if (data.__ob__) {
    return data.__ob__;
  }
  //   console.log(data);
  return new Observer(data);
}
