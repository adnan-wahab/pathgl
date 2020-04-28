import React from 'react'
import GraphRenderer from '../src';
export default { title: 'size Test' };

import createGraphOnce from './singleton'
import _ from 'lodash'
let favorites = []

export const rebalanceSizeAttenuation = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})

  let i = 0

  let bounce  = _.debounce((e) => {
    console.log('rebalance', i)
    graph.setState({sizeAttenuation: (i+=.3)});
  }, 1000)

  graph.on('wheel', bounce)

  return canvas
};



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
