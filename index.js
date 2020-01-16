import init from './src/test';
const GraphRenderer = () => {
  let canvas = document.createElement('canvas')
  init(canvas)
  return canvas;
}
export default GraphRenderer;
