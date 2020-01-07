let _ = require('lodash')
let nodes = require('./nodes')

let edges = require('./edges')



let c = [
  './data/eastwestcommute.json',
  './data/philippines.json',
  './data/sfcommute.json',
  './data/world.json',
  './data/dataKMeans.json'
]

let url = c[4]

let clip = (d) => {
  return d / 4000
}
console.log('fetching url '+ url)
fetch(url)
  .then((body)=>{ return body.json() })
  .then((json)=>{
    init(json)
    // init(json.map(
    //   (d) => { return d.data.coords.map((d, i) => { return d / (i % 2 ? innerWidth: innerHeight )})
    //          })
    //     )
  })

  let processKMeans = (data) => {
    let edges = new Array(data.edges.length * 4).fill(0)
    data.edges.forEach((edge, idx) => {
      edges[idx*4] = clip(data.nodes[edge.source].x)
      edges[idx*4+1] = clip(data.nodes[edge.source].y)
      edges[idx*4+2] = clip(data.nodes[edge.target].x)
      edges[idx*4+3] = clip(data.nodes[edge.target].y)
    })
    window.e = edges
    return edges
  }

  let pos = [[-.5, -.5], [+.5, -.5], [+.5, +.5], [-.5, +.5]]


let init = (data) => {
  let width = innerWidth, height = innerHeight
  let pos = processKMeans(data)
  return edges(pos, {
    width: width,
    height: height,
    root: document.querySelector('body')
  })
}
