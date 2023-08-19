import initMixins from "./init";

function Vue(options) {
  initMixins(Vue);
  this._init(options);
}

export default Vue;
