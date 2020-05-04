import React from 'react'
import GraphRenderer from '../src';
import *  as d3 from 'd3'
import _ from 'lodash'
export default { title: 'tooltip' };


// TimeBasedChartTooltip-module-4ruaa--root {
//     font-family: "Roboto Mono", Menlo, Inconsolata, "Courier New", Courier, monospace;
//     font-size: 11px;
//     line-height: 1.4;
//     max-width: 350px;
//     overflow-wrap: break-word;
// }

// position: absolute;
//     pointer-events: none;
//     z-index: 99999;
//     top: 0px;
//     left: 0px;
//     transform: translate3d(792px, 680px, 0px);
//     will-change: transform;
import createGraphOnce from './singleton'
let favorites = []


export const tooltip = () => {


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

  let width = innerWidth, height = innerHeight
  let [graph, canvas] = createGraphOnce({

  })

  const container = d3.create('div')

  const svg = container.append('div')

  let tip = svg.append('div')


  _.each(styles, (key, value) => { tip.style(value, key)})
  console.log(tip.node())
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


  svg.style('position', 'absolute')


  //const tooltip = svg.append("g");

  container.node().appendChild(canvas)


  return container.node()
};
