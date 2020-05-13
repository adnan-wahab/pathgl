import GraphRenderer from '../src';
import * as d3 from 'd3'
import _ from 'lodash'

let canvas = document.createElement('canvas')

let main = () => {


  document.body.appendChild(canvas)

  load('./data/theCut.json')

  document.title = 'REGL NETWORK VIS'
}


let styles = {
    'font-size': '16px',
    'font-weight': '500',
    'background-color': 'rgb(41, 50, 60)',
    'color': 'rgb(160, 167, 180)',
    'z-index': '1001',
    'position': 'fixed',
    'overflow-x': 'auto',
    'top': '541px',
    'max-width': '1000px',
    'right': '185px',
    'width': '200px',
    'display': 'flex',
    'box-sizing': 'border-box',
    'max-width': '100%',
    'color': 'rgb(248, 248, 248)',
    'min-width': '0px',
    'min-height': '0px',
    'flex-direction': 'column',
    'outline': 'none',
    'margin': '6px',
    'background': 'rgb(119, 119, 119)',
    'padding': '12px',
    'opacity': '.8',
    'pointer-events': 'none'

}

let favorites = []
let load = (url) => {
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
        window.graph = GraphRenderer.init({
          data: json,
          canvas: canvas,
          width: innerWidth,
          height: innerHeight,

          // onClick: (point, idx, events) => {
          //   if (events.shiftKey)favorites = favorites.concat(idx)
          //   graph.setState({favorites})
          // }
        })
        // graph.setState({flatSize: false})
         graph.setState({'color': 'specific'})

         graph.on('wheel', (delta) => {
           graph.setState({sizeAttenuation: delta / 1000})
         })
        // graph.setState({sizeAttenuation: 1})

        //graph.on('hover', (d) => {console.log(d)})

        let tip = d3.select('body').append('div')

        _.each(styles, (key, value) => { tip.style(value, key)})

        graph.on('hover', (i, node, event, coordinates) => {
          if (! node) return console.log('off')
          tip.text(node.text)
          tip.style('display', 'block')
          tip.style('left', coordinates[0] + 'px')
          tip.style('top', coordinates[1] + 'px')

        })

        graph.on('hoverOff', (i, node, event, coordinates) => {

          tip.style('display', 'none')
        })


    })
}
d3.select(window).on('load', main)
