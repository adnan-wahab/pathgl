import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Set Node Properties' };

import _ from 'lodash'
import createGraphOnce from './singleton'

let range = (n) => _.range(n)

export const setNodeColor = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>submit</button> <input type="number"> <input type="color"></submit>'


  div.addEventListener('submit', (e) => {
    e.preventDefault()

    let [num, color] = div.querySelectorAll('input');
    console.log(+num.value)
    graph.setNodeColor(range(+num.value), color.value)

  })


  div.appendChild(canvas)

  return div
};

export const setNodeSize = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>submit</button> <input type="number"><input type="number">'


  div.addEventListener('submit', (e) => {
    e.preventDefault()

    let [num, size] = div.querySelectorAll('input');

    graph.setNodeSize(range(+num.value), +size.value)

  })


  div.appendChild(canvas)

  return div
};

export const setNodeVisibility = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>submit</button> <input type="number"></form>'


  div.addEventListener('submit', (e) => {
    e.preventDefault()

    let [num] = div.querySelectorAll('input');

    graph.setNodeVisibility(range(+num.value), 0)
  })


  div.appendChild(canvas)

  return div
};


export const setNodeShape = () => {
  let [graph, canvas] = createGraphOnce()
  let div = document.createElement('div')


div.innerHTML = '<form><button>submit</button> <input type="number"><input type="number"></form>'


  div.addEventListener('submit', (e) => {
    e.preventDefault()

    let [num, size] = div.querySelectorAll('input');

    graph.setNodeShape(range(+num.value), +size.value)

  })


  div.appendChild(canvas)

  return div
};
