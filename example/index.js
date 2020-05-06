import GraphRenderer from '../src';
import * as d3 from 'd3'

let canvas = document.createElement('canvas')

let main = () => {


  document.body.appendChild(canvas)
  //canvas.style.paddingTop = '100px'
  canvas.height = innerHeight
  canvas.width = innerWidth
  load('nestle.json')

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
        // graph.setState({flatSize: false})
         graph.setState({'color': 'specific'})

         graph.on('wheel', (e) => {
           console.log(e)
         })
        // graph.setState({sizeAttenuation: 1})

        //graph.on('hover', (d) => {console.log(d)})
    })
}
d3.select(window).on('load', main)
