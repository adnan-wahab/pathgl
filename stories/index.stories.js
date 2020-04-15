import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Initial Test' };

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
