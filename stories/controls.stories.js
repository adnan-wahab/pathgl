import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Controls' };
import theCutJSON from './public/thecut.json';
import mbJSON from './public/mobile-banking.json';

import processData from './processData';

export const clusterHiding = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(mbJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};

export const favoriting = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(mbJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};

export const colorChanges = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(mbJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};
