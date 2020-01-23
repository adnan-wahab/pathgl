
let GraphRenderer = require('./index')
let d3 = require('d3')

module.exports = GraphRenderer

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
      GraphRenderer.init({ data: json, canvas: canvas })
    })
}
