import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Initial Test' };
import theCutJSON from './public/mobile-banking.json';

import mbJSON from './public/mobile-banking.json';

import processData from './processData';

let favorites = []
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
      showLines: false,
      flatSize: true
    },
    onClick: (point, idx, events) => {
      //graph.setState({favorites})
    }
  })

  return canvas
};
