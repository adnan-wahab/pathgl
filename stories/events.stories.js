import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Events ' };

import createGraphOnce from './singleton'
let favorites = []


export const events = () => {
  let [graph, canvas] = createGraphOnce({

  })


  let events = ['blur' ,
  'mousedown' ,
  'mouseup' ,
  //'mousemove' ,
  'mouseenter' ,
  'mouseleave' ,
  'click' ,
  'wheel',
  'hover']

  events.forEach(d => {
    graph.on(d, (args) => {
      console.log(d, args)
    })
  })
  return canvas
};


export const select = () => {
  let [graph, canvas] = createGraphOnce({

  })

  let div = document.createElement('div')

  div.innerHTML = '<form> <button>Select Point</button>  </form>'

    let [select] = div.querySelectorAll('button')

    select.addEventListener('click', (e) => {
      e.preventDefault()
      graph.select(Math.random() * 1000 | 0)
    })

    div.appendChild(canvas)
  return div
};
