
let _ = require('lodash')
let GraphRenderer = require('./index')
let d3 = require('d3')

let clip = (d) => {
  return d / 4000
}

let processKMeans = (data) => {
    let edges = new Array(data.edges.length * 4).fill(0);
    data.edges.forEach((edge, idx) => {
      edges[idx*4] = clip(data.nodes[edge.source].x)
      edges[idx*4+1] = clip(data.nodes[edge.source].y)
      edges[idx*4+2] = clip(data.nodes[edge.target].x)
      edges[idx*4+3] = clip(data.nodes[edge.target].y)
    });
    let color = _.flatten(data.edges.map((e) => {
      let c = d3.color(data.nodes[e.source].color);
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let fboColor = color.map((d, i) => {
      return i / color.length
    })
    return {
      position: edges,
      color,
      fboColor,
    }
  }

let init = (options) => {
  return GraphRenderer({
    attributes: processKMeans(options.data),
    canvas: options.canvas,
    width: options.width,
    height: options.heigth,
    onHover: options.onHover || function () {},
    data: options.data
  })
}

module.exports = init


if (window.location.port == 9966) {
  let c = [
    './data/eastwestcommute.json',
    './data/philippines.json',
    './data/sfcommute.json',
    './data/world.json',
    './data/dataKMeans.json'
  ]

  let url = c[4]
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      let canvas = document.createElement('canvas')
      canvas.height = innerHeight
      canvas.width = innerWidth
      document.body.appendChild(canvas)
      init({ data: json, canvas: canvas })
    })
}
