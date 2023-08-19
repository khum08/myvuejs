import babel from "@rollup/plugin-babel";

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "./src/index.js",
  output: {
    file: "./dist/vue.js",
    format: "umd",
    name: "Vue",
    sourcemap: true,
  },
  plugins: [
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
  ],
};
