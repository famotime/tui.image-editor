import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import vue from 'rollup-plugin-vue';
import pkg from './package.json';

const banner = `
/*!
 * TOAST UI ImageEditor : Vue Wrapper
 * @version ${pkg.version}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */
`.trim();

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/toastui-vue-image-editor.js',
    format: 'cjs',
    exports: 'auto',
    banner,
  },
  external: ['vue', 'tui-image-editor', /@babel\/runtime/],
  plugins: [
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    }),
    nodeResolve(),
    commonjs(),
    vue(),
  ],
};
