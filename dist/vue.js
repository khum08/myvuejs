(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z".concat(unicodeRegExp.source, "]*");
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
  var startTagOpen = new RegExp("^<".concat(qnameCapture));
  var startTagClose = /^\s*(\/?)>/;
  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>"));
  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  var ELEMENT_TYPE = 1;
  var TEXT_TYPE = 3;
  var parseHTML = function parseHTML(html) {
    var index = 0;
    function advance(step) {
      index += step;
      html = html.substring(step);
    }
    var stack = [];
    var root = null;
    var currParent;
    function createASTNode(tag, attrs) {
      return {
        tag: tag,
        attrs: attrs,
        type: ELEMENT_TYPE,
        parent: null,
        children: []
      };
    }
    function start(tag, attrs) {
      var node = createASTNode(tag, attrs);
      if (!root) {
        root = node;
        currParent = node;
      } else {
        node.parent = currParent;
        currParent.children.push(node);
        currParent = node;
      }
      stack.push(node);
    }
    function chars(text) {
      text = text.replace(/\s/g, "");
      text && currParent.children.push({
        type: TEXT_TYPE,
        text: text,
        parent: currParent
      });
    }
    function end(tag) {
      stack.pop();
      currParent = stack[stack.length - 1];
    }
    function parseStartTag() {
      var startT = html.match(startTagOpen);
      if (startT) {
        var match = {
          tagName: startT[1],
          attrs: [],
          start: 0,
          end: 0
        };
        advance(startT[0].length);
        var attr, _end;
        while (!(_end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          // console.log(end, attr);
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        if (_end) {
          match.unarySlash = _end[1];
          advance(_end[0].length);
          match.end = index;
          // console.log(match);
          return match;
        }
      }
    }
    while (html) {
      var textEnd = html.indexOf("<");
      // 标签
      if (textEnd === 0) {
        // 结束标签
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[0]);
        }

        // 开始标签
        var startTagMatch = parseStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
        }
      }

      // 文本
      if (textEnd > 0) {
        var text = html.substring(0, textEnd);
        advance(text.length);
        chars(text);
      }
    }
    return root;
  };
  function compileToFunction(template) {
    console.log(template);
    var ast = parseHTML(template);
    console.log(ast);
    var code = codegen(ast);
    console.log(code);
    var render = "with(this){return ".concat(code, "}");
    // console.log(render);
    return new Function(render);
  }
  function genProp(attrs) {
    var res = "";
    attrs.forEach(function (item) {
      if (item[1] === "style") {
        var styleStr = item[3];
        // console.log(styleStr);
        var s = "";
        var pairs = styleStr.split(";");
        for (var i = 0; i < pairs.length - 1; i++) {
          var kv = pairs[i].split(":");
          s += "".concat(JSON.stringify(kv[0].trim()), ":").concat(JSON.stringify(kv[1].trim()), ",");
        }
        res += "\"style\":{".concat(s.slice(0, -1), "},");
      } else {
        res += "\"".concat(item[1].trim(), "\":\"").concat(item[3].trim(), "\",");
      }
    });
    res = res.slice(0, -1);
    return "{".concat(res, "}");
  }
  function gen(child) {
    if (child.type === ELEMENT_TYPE) {
      return codegen(child);
    } else if (child.type === TEXT_TYPE) {
      var text = child.text;
      if (defaultTagRE.test(text)) {
        var tokens = [];
        var match;
        var index = 0;
        var lastIndex = defaultTagRE.lastIndex = 0;
        while (match = defaultTagRE.exec(text)) {
          index = match.index;
          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }
          tokens.push("_s(".concat(match[1], ")"));
          lastIndex = index + match[0].length;
        }
        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }
        return "_v(".concat(tokens.join("+"), ")");
      } else {
        return "_v(".concat(JSON.stringify(text), ")");
      }
    }
  }
  function genChildren(children) {
    return children.map(function (child) {
      return gen(child);
    }).join(",");
  }

  // _c('div', {'id': 'a', 'x': 1}, _c('div', {style: {"color": ""}, _v(_s(name) + "hello")}));
  function codegen(ast) {
    var res = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    if (ast.type === ELEMENT_TYPE) {
      res += "_c(".concat(JSON.stringify(ast.tag)).concat(ast.attrs.length > 0 ? ",".concat(genProp(ast.attrs)) : ",null").concat(ast.children.length > 0 ? ",".concat(genChildren(ast.children)) : "", ")");
    }
    if (ast.type === TEXT_TYPE) {
      res += "_v(".concat(JSON.stringify(ast.text), ")");
    }
    if (ast.children && ast.children.length) ;
    return res;
  }

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

  var id$1 = 0;
  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);
      this.id = id$1++;
      this.subs = []; // watchers
    }
    _createClass(Dep, [{
      key: "addSub",
      value: function addSub(sub) {
        this.subs.push(sub);
      }
    }, {
      key: "depend",
      value: function depend() {
        if (Dep.target) {
          Dep.target.addDep(this);
        }
      }
    }, {
      key: "notify",
      value: function notify() {
        this.subs.forEach(function (sub) {
          return sub.update();
        });
      }
    }]);
    return Dep;
  }();

  var queue = [];
  var has = {};
  var waiting = false;
  function queueWatcher(watcher) {
    if (!has[watcher.id]) {
      queue.push(watcher);
      has[watcher.id] = true;
    }
    if (!waiting) {
      waiting = true;
      setTimeout(function () {
        var copies = queue.slice(0);
        queue.length = 0;
        has = {};
        copies.forEach(function (watcher) {
          return watcher.run();
        });
        waiting = false;
      }, 0);
    }
  }

  var id = 0;
  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, expOrFn, callback) {
      _classCallCheck(this, Watcher);
      this.id = id++;
      this.vm = vm;
      this.getter = expOrFn; // 调用模版引擎生成虚拟dom，然后调用patch方法更新真实dom
      this.deps = [];
      this.depIds = new Set();
      this.get();
    }
    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        Dep.target = this;
        this.getter();
        Dep.target = null;
      }
    }, {
      key: "run",
      value: function run() {
        this.get();
      }
    }, {
      key: "update",
      value: function update() {
        queueWatcher(this);
      }
    }, {
      key: "addDep",
      value: function addDep(dep) {
        var id = dep.id;
        if (!this.depIds.has(id)) {
          this.depIds.add(id);
          this.deps.push(dep);
          dep.addSub(this);
        }
      }
    }]);
    return Watcher;
  }();

  function vnode(tag, data, key, children, text, vm) {
    return {
      tag: tag,
      data: data,
      key: key,
      children: children,
      text: text,
      vm: vm
    };
  }
  function createTextVnode(text) {
    return vnode(undefined, undefined, undefined, undefined, text);
  }
  function createElementVNode(tag) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (data == null) data = {};
    for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }
    return vnode(tag, data, data.key || "", children);
  }

  function mountComponent(vm, el) {
    // console.log(vm._render());
    // vm._update(vm._render());
    var updateComponent = function updateComponent() {
      console.log("===== updateComponent =====");
      vm._update(vm._render());
    };
    new Watcher(vm, updateComponent, function () {});
  }
  function patch(oldVnode, vnode) {
    var isRealElement = oldVnode.nodeType;
    if (isRealElement) {
      var oldElm = oldVnode;
      var parentElm = oldElm.parentNode;
      var el = createElm(vnode);
      parentElm.insertBefore(el, oldElm.nextSibling);
      parentElm.removeChild(oldElm);
      return el;
    }
  }
  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      var vm = this;
      vm.$el = patch(vm.$el, vnode);
    };
    Vue.prototype._render = function () {
      var vm = this;
      var render = vm.$options.render;
      var vnode = render.call(vm);
      return vnode;
    };
    Vue.prototype._c = function () {
      return createElementVNode.apply(void 0, arguments);
    };
    Vue.prototype._v = function (text) {
      return createTextVnode(text);
    };
    Vue.prototype._s = function (val) {
      return val == null ? "" : _typeof(val) === "object" ? JSON.stringify(val) : val;
    };
  }
  function createElm(vnode) {
    var tag = vnode.tag,
      data = vnode.data,
      children = vnode.children,
      text = vnode.text;
      vnode.vm;
    if (typeof tag === "string") {
      vnode.el = document.createElement(tag);
      // updateProperties(vnode);
      if (data) {
        Object.keys(data).forEach(function (key) {
          if (key === "style") {
            Object.keys(data[key]).forEach(function (styleKey) {
              vnode.el.style[styleKey] = data[key][styleKey];
            });
          } else {
            vnode.el.setAttribute(key, data[key]);
          }
        });
      }
      children.forEach(function (child) {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }
    return vnode.el;
  }

  var arrayProto = Array.prototype;
  var arrayMethods = Object.create(arrayProto);
  var methodsToPatch = ["push", "pop", "splice", "unshift", "shift", "sort", "reserve"];
  methodsToPatch.forEach(function (method) {
    var original = arrayMethods[method];
    Object.defineProperty(arrayMethods, method, {
      value: function mutator() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        var result = original.apply(this, args);
        var ob = this.__ob__;
        var inserted;
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
      enumerable: false
    });
  });

  var Observer = /*#__PURE__*/function () {
    function Observer(data) {
      _classCallCheck(this, Observer);
      // console.log("Observer", data);
      this.dep = new Dep();
      Object.defineProperty(data, "__ob__", {
        value: this,
        enumerable: false
      });
      if (Array.isArray(data)) {
        // 劫持数组
        Object.getOwnPropertyNames(arrayMethods).forEach(function (key) {
          Object.defineProperty(data, key, {
            value: arrayMethods[key]
          });
        });
        this.observeArray(data);
      } else {
        this.walk(data);
      }
    }
    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        Object.keys(data).forEach(function (key) {
          defineReactive(data, key, data[key]);
        });
      }
    }, {
      key: "observeArray",
      value: function observeArray(data) {
        // console.log("Observer", data);
        data.forEach(function (item) {
          //   console.log("Observer", item);
          observe(item);
        });
      }
    }]);
    return Observer;
  }();
  function defineReactive(target, key, value) {
    var childOb = observe(value);
    var dep = new Dep();
    Object.defineProperty(target, key, {
      get: function get() {
        console.log("取值::", value);
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        return value;
      },
      set: function set(newValue) {
        if (newValue === value) return;
        observe(newValue);
        console.log("设值::", newValue);
        value = newValue;
        dep.notify();
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== "object" || data === null) return;
    if (data.__ob__) {
      return data.__ob__;
    }
    //   console.log(data);
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
    //   console.log(data);
    vm._data = data;
    observe(data);
    proxy(vm, "_data");
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      // console.log("init", options);
      var vm = this;
      Vue.$vm = vm;
      vm.$options = options;
      initState(vm);
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    Vue.prototype.$mount = function (el) {
      var vm = this;
      el = document.querySelector(el);
      vm.$el = el;
      var template = vm.$options.template;
      if (!vm.$options.render) {
        if (!template && el) {
          template = el.outerHTML;
        }
        //   console.log("rendering template", template);
        if (template) {
          var render = compileToFunction(template);
          vm.$options.render = render;
        }
      }
      mountComponent(vm);
    };
  }

  function Vue(options) {
    this._init(options);
  }
  initMixin(Vue);
  lifecycleMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
