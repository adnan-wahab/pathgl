import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Export' };

import createGraphOnce from './singleton'
let favorites = []




export const takeScreenShot = () => {
  let [graph, canvas] = createGraphOnce()

  let div = document.createElement('div')

  let input = document.createElement('button')

  input.type = 'button'
  input.textContent = 'take screenshot'

  let a = document.createElement('a')

  div.appendChild(a)
  console.log(input)
  let img = document.createElement('img')
  div.appendChild(img)

  input.addEventListener('click', (e) => {
    let image = graph.state.screenshot.replace("image/png", "image/octet-stream");

    //window.location.href=image;
    img.src = image
    a.href = image
    a.download = 'download.png'
    window.open(image)
    //a.textContent = 'click me to get screenshot'
    //window.location = image
    //window.document.write('<iframe src="' + image  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" ></iframe>');

  })
  div.appendChild(input)
  div.appendChild(canvas)

  return div
};
