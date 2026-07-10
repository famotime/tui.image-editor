import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import pkg from './package.json';

const banner = `
/*!
 * TOAST UI ImageEditor : React Wrapper
 * @version ${pkg.version}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */
`.trim();

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/toastui-react-image-editor.js',
    format: 'cjs',
    exports: 'auto',
    banner,
  },
  external: ['react', 'tui-image-editor', /@babel\/runtime/],
  plugins: [
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: ['@babel/plugin-transform-runtime'],
      extensions: ['.js', '.jsx'],
    }),
    nodeResolve(),
    commonjs(),
  ],
};
