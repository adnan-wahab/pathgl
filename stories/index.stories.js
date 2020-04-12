import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Initial Test' };
import theCutJSON from './public/test123.json';
import mbJSON from './public/mobile-banking.json';

import processData from './processData';


export const theCut = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(theCutJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};

export const inDegreeSizing = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(mbJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    initialState: {
      showLines: false
    },
    onClick: (point, idx, events) => {
      //graph.setState({favorites})
    }
  })

  return canvas
};

export const flatSizing = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(mbJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    initialState: {
      showLines: false
    },
    onClick: (point, idx, events) => {
      //graph.setState({favorites})
    }
  })

  return canvas
};
