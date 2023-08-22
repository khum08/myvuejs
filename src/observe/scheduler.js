const queue = [];
let has = {};
let waiting = false;
export default function queueWatcher(watcher) {
  if (!has[watcher.id]) {
    queue.push(watcher);
    has[watcher.id] = true;
  }
  if (!waiting) {
    waiting = true;
    setTimeout(() => {
      let copies = queue.slice(0);
      queue.length = 0;
      has = {};
      copies.forEach((watcher) => watcher.run());
      waiting = false;
    }, 0);
  }
}
