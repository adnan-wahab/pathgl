import React from 'react'
import GraphRenderer from '../src';
export default { title: 'size Test' };

import createGraphOnce from './singleton'
let favorites = []
export const inDegreeSizing = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: false})

  return canvas
};

export const flatSizing = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})
  return canvas
};

export const sizeAttenuation = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')

  let input = document.createElement('input')
  input.type = 'range'
  input.addEventListener('change', (e) => graph.setState({sizeAttenuation: e.target.value / 100}))
  div.appendChild(input)
  div.appendChild(canvas)

  graph.setState({flatSize: true})
  return div
};
