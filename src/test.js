
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

let pos = [[-.5, -.5], [+.5, -.5], [+.5, +.5], [-.5, +.5]]
let adnan = d3.select('body')
.append('div')
.attr('class','adnan');
adnan.text('hello');
adnan.style('position', 'absolute')
adnan.style('color', 'white')
    .style('z-index', 1231232)
window.adnan = adnan
let init = (data) => {
  let width = innerWidth, height = innerHeight
  let pos = processKMeans(data)
  return GraphRenderer(pos, {
    width: width,
    height: height,
    root: document.querySelector('body'),
    data: data.nodes,
    onHover: (node) => {
      console.log(node)
      adnan.text(node.label)
    }
  })
}
