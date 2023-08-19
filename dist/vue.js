(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  var Observer = /*#__PURE__*/function () {
    function Observer(data) {
      _classCallCheck(this, Observer);
      this.walk(data);
    }
    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        Object.keys(data).forEach(function (key) {
          defineReactive(data, key, data[key]);
        });
      }
    }]);
    return Observer;
  }();
  function defineReactive(target, key, value) {
    observe(value);
    Object.defineProperty(target, key, {
      get: function get() {
        console.log("取值::", value);
        return value;
      },
      set: function set(newValue) {
        if (newValue === value) return;
        observe(newValue);
        console.log("设值::", newValue);
        value = newValue;
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== "object" || data === null) return;
    console.log(data);
    return new Observer(data);
  }

  function initState(vm) {
    var data = vm.$options.data;
    if (data) {
      initData(vm);
    }
  }
  function proxy(target, sourceKey, key) {
    Object.keys(target[sourceKey]).forEach(function (key) {
      Object.defineProperty(target, key, {
        get: function get() {
          return target[sourceKey][key];
        },
        set: function set(newValue) {
          target[sourceKey][key] = newValue;
        }
      });
    });
  }
  function initData(vm) {
    var data = vm.$options.data;
    data = typeof data === "function" ? data.call(vm) : data;
    console.log(data);
    vm._data = data;
    observe(data);
    proxy(vm, "_data");
  }

  function initMixins(Vue) {
    Vue.prototype._init = function (options) {
      // console.log("init", options);
      var vm = this;
      Vue.$vm = vm;
      vm.$options = options;
      initState(vm);
    };
  }

  function Vue(options) {
    initMixins(Vue);
    this._init(options);
  }

  return Vue;

}));
//# sourceMappingURL=vue.js.map
