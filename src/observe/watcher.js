import Dep from "./dep";
import queueWatcher from "./scheduler";

let id = 0;
export default class Watcher {
  constructor(vm, expOrFn, callback) {
    this.id = id++;
    this.vm = vm;
    this.getter = expOrFn; // 调用模版引擎生成虚拟dom，然后调用patch方法更新真实dom
    this.deps = [];
    this.depIds = new Set();
    this.get();
  }

  get() {
    Dep.target = this;
    this.getter();
    Dep.target = null;
  }

  run() {
    this.get();
  }

  update() {
    queueWatcher(this);
  }

  addDep(dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
}
