import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Filter Tests' };
import theCutJSON from './public/thecut.json';
import mbJSON from './public/mobile-banking.json';

import processData from './processData';


export const asdf = () => {
  let button = document.createElement('button')
  button.innerText = '😀 😎 👍 💯';
  return button
}

export const dateFilter = () => {
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

export const sentimentFilter = () => {
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
