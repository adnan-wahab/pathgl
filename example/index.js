// /* eslint no-console: 0 */
//
import GraphRenderer from '../src';
import * as d3 from 'd3'

let url = [
  'thecut.json',
  'mobile-banking.json',
  'd.tsv',
  '10samps.json'
]

const clip = (d) => {
return d / 4000
}
// var mouseX = (e.offsetX / canvas.clientWidth)*2-1;
// var mouseY = ((canvas.clientHeight - e.offsetY) / canvas.clientHeight)*2-1;


let canvas = document.createElement('canvas')

let main = () => {
  document.body.appendChild(canvas)

  canvas.height = innerHeight
  canvas.width = innerWidth
  load('data/thecut0.json')

  document.title = 'REGL NETWORK VIS'
}


let favorites = []
let load = (url) => {
  if (url.includes('.tsv')) return loadTSV(window.location.tsv)
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      //yay(json)

        window.graph = GraphRenderer.init({
          data: json,
          drawCurves: true,
          canvas: canvas,
          onClick: (point, idx, events) => {
            if (events.shiftKey)favorites = favorites.concat(idx)
            graph.setState({favorites})
          }
        })
        graph.setState({color: 'general'})

    })
    let parseColor = (rgb) => {
      let c = d3.rgb(rgb)
      return [c.r /255 , c.g /255 , c.b /255];
    }
    d3.selectAll('input').on('input', (d,i) => {
      let colors = Array.from(document.querySelectorAll('input'))
      .map(d=> d.value)
    })


}
d3.select(window).on('load', main)
