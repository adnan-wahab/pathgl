import GraphRenderer from '../src';
import * as d3 from 'd3'

let canvas = document.createElement('canvas')

let main = () => {
  document.body.appendChild(canvas)

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
          // onClick: (point, idx, events) => {
          //   if (events.shiftKey)favorites = favorites.concat(idx)
          //   graph.setState({favorites})
          // }
        })
        graph.setState({'color': 'specific'})


    })
}
d3.select(window).on('load', main)
