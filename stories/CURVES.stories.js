import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Select Sub Group' };
import theCutJSON from './public/thecut.json';
import mbJSON from './public/mobile-banking.json';
import samps from './public/10samps.json';

import processData from './processData';

export const InstancedBeziers = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(samps)

  let graph = GraphRenderer.init({
    attributes,
    drawCurves: true,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};
