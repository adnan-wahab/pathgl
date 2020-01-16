import adnan from './src/test';

export default (jason) => {
  let canvas = document.createElement('canvas')
  canvas.style.pointerEvents = 'none';
  GraphRenderer(jason, canvas)
  return canvas;
};
