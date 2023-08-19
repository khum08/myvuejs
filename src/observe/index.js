class Observer {
  constructor(data) {
    this.walk(data);
  }
  walk(data) {
    Object.keys(data).forEach((key) => {
      defineReactive(data, key, data[key]);
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
  console.log(data);
  return new Observer(data);
}
