import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Select Sub Group' };
import theCutJSON from './public/thecut.json';
import mbJSON from './public/mobile-banking.json';
import samps from './public/10samps.json';


export const InstancedBeziers = () => {
  let canvas = document.createElement('canvas')


  let graph = GraphRenderer.init({
    data: mbJSON,

    drawCurves: true,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};
