import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Export' };

import createGraphOnce from './singleton'
let favorites = []




export const takeScreenShot = () => {
  let [graph, canvas] = createGraphOnce()

  let div = document.createElement('div')

  let input = document.createElement('input')

  input.type = 'button'
  input.value = 'open the console'

  input.addEventListener('click', (e) => {
    let img = document.createElement('img')
    img.src = canvas.toDataURL()
    div.insertBefore(img, canvas)
    console.log(img)
  })
  div.appendChild(input)
  div.appendChild(canvas)

  return div
};
