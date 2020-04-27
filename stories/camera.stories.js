import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Camera Controls' };

import _ from 'lodash'
import createGraphOnce from './singleton'

let range = (n) => _.range(n)

export const zoomToNode = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>zoom To Visible</button> <button>Reset Zoom</button>  </form>'

  let [zoom, reset] = div.querySelectorAll('button')

  zoom.addEventListener('click', (e) => {
    e.preventDefault()
    graph.zoomToNode(Math.random() * 1000 | 0)
  })

  reset.addEventListener('click', (e) => {
    e.preventDefault()
    graph.resetView()
  })

  div.appendChild(canvas)

  return div
};

export const setSize = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>changeSize</button></form>'

  let [sizeChange] = div.querySelectorAll('button')

  sizeChange.addEventListener('click', (e) => {
    e.preventDefault()
    graph.setSize(Math.random() * innerWidth, Math.random() * innerHeight)
  })



  div.appendChild(canvas)

  return div
};
