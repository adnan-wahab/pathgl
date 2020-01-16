
let _ = require('lodash')
let GraphRenderer = require('./index')
let d3 = require('d3')

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

let colors = [
     [237, 248, 251],
      [191, 211, 230],
      [158, 188, 218],
   [136, 86, 167],
     [129, 15, 124]
 ]


  let processKMeans = (data) => {
    let edges = new Array(data.edges.length * 4).fill(0);
    data.edges.forEach((edge, idx) => {
      edges[idx*4] = clip(data.nodes[edge.source].x)
      edges[idx*4+1] = clip(data.nodes[edge.source].y)
      edges[idx*4+2] = clip(data.nodes[edge.target].x)
      edges[idx*4+3] = clip(data.nodes[edge.target].y)
    });

    let color = _.flatten(data.edges.map((e, i) => {
      let c =  colors[i%4]

      return c.map(d => d / 255)
      //let c = d3.color(data.nodes[e.source].color);
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

let adnan = d3.select('body')
.append('div')
.attr('class','adnan');
adnan.text('hello');
adnan.style('position', 'absolute')
adnan.style('color', 'white')
    .style('z-index', 1231232)

let init = (data, canvas) => {
  console.log(data)
  return GraphRenderer({
    attributes: processKMeans(data),
    canvas: canvas,
    root: document.querySelector('body'),
    data: data.nodes,
    onHover: (node) => {
      console.log(node)
      adnan.text(node.label)
    }
  })
}

window.GraphRenderer = init;




fetch(url)
  .then((body)=>{ return body.json() })
  .then((json)=>{
    let canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    console.log(json)
    init(json, canvas)
  })
