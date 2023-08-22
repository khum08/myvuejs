import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";

function Vue(options) {
  this._init(options);
}
initMixin(Vue);
lifecycleMixin(Vue);
export default Vue;
