import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Hide and Show' };

import createGraphOnce from './singleton'


export const cluster = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


  let clusters = [1,2,3,4,5,6].map(d => {

 return `<label>Cluster ${d}
      <input type="checkbox" checked id="${d}">
    </label>`
  })
  div.innerHTML = clusters.join('\n')

  div.addEventListener('change', (e) => {
    let showing = Array.from(div.querySelectorAll('input')).map(e => e.checked)

    graph.setState({showCluster: showing})
  })

  graph.setState({color:'general'})
  div.appendChild(canvas)

  return div
};

// export const node = () => {
//   let [graph, canvas] = createGraphOnce()
//
//   graph.setState({showNodes: false})
//
//   return canvas
// };
//
//
// export const edges = () => {
//   let [graph, canvas] = createGraphOnce()
// graph.setState({showLines: true})
//
//   return canvas
// };
