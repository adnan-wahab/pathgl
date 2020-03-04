import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

const basePlugins = [
  resolve({
    dedupe: ['gl-matrix'],
    mainFields: ['module', 'main']
  }),
  commonjs({ sourceMap: false }),
  json()
];

const configurator = (file, format, plugins = []) => ({
  input: 'src/index.js',
  output: {
    name: 'createScatterplot',
    format,
    file,
    globals: {
      regl: 'createREGL'
    }
  },
  plugins: [...basePlugins, ...plugins],
  external: ['regl']
});

const devConfig = configurator('dist/regl-network-vis.js', 'umd', [
  //babel(),
  filesize(),
  visualizer()
]);

const prodConfig = configurator('dist/regl-network-vis.js', 'umd', [
  //babel(),
  terser()
]);

const esmConfig = configurator('dist/regl-network-vis.esm.js', 'esm', [
  filesize()
]);

export default [devConfig, prodConfig, esmConfig];
