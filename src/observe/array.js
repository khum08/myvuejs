const arrayProto = Array.prototype;

export const arrayMethods = Object.create(arrayProto);

const methodsToPatch = [
  "push",
  "pop",
  "splice",
  "unshift",
  "shift",
  "sort",
  "reserve",
];

methodsToPatch.forEach(function (method) {
  const original = arrayMethods[method];
  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      let result = original.apply(this, args);
      const ob = this.__ob__;
      let inserted;
      switch (method) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          inserted = args.slice(2);
          break;
      }
      if (inserted) {
        ob.observeArray(inserted);
      }

      this.__ob__.dep.notify();
      // console.log("array call", method, args, inserted);
      return result;
    },
    enumerable: false,
  });
});
