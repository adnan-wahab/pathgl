import GraphRenderer from '../src';
import * as d3 from 'd3'

let canvas = document.createElement('canvas')

let main = () => {

  let div = document.createElement('div')
  div.style.height  = '100px'
  div.style.width = '100px'
  div.innerHTML = 'I am a div'
  document.body.appendChild(div)

  document.body.appendChild(canvas)
  //canvas.style.paddingTop = '100px'
  canvas.height = innerHeight
  canvas.width = innerWidth
  load('data/thecut1.json')

  document.title = 'REGL NETWORK VIS'
}


let favorites = []
let load = (url) => {
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      console.log(json)
        window.graph = GraphRenderer.init({
          data: json,
          canvas: canvas,
          height: 100,
          width: 100,
          // onClick: (point, idx, events) => {
          //   if (events.shiftKey)favorites = favorites.concat(idx)
          //   graph.setState({favorites})
          // }
        })
        graph.setState({flatSize: false})
        graph.setState({'color': 'specific'})
        graph.setState({sizeAttenuation: 1})

        //graph.on('hover', (d) => {console.log(d)})
    })
}
d3.select(window).on('load', main)
