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
  load('data/10samps.json')

  document.title = 'REGL NETWORK VIS'
}

let preprocessData = (d) => {
  let keys = {}
  d.nodes.forEach((node, id) => {
    node.size = 0
    keys[node.uuid] = id
  })

  d.edges.forEach(d => {
    d.target = keys[d.target]
    d.source = keys[d.source]
  })
  let normalize = (d, i) => {
    d.nodes = d.nodes.map(id => keys[id])
  }

  _.each(d.kmeans, normalize)
  _.each(d.louvain, normalize)
  _.each(d.greedy, normalize)

}


let processData = (data) => {
preprocessData(data)

 let colors = data.nodes.map(d => {
   d.x = clip(d.x)
   d.y = clip(d.y)
   return [Math.random(), Math.random(), Math.random()]
 })

  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentimentValue = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  let counts = {}
  data.edges.forEach(d => {
    data.nodes[d.target].size += 1
    data.nodes[d.source].size += 1
  })



  let position =
  (data.nodes.map((d, id) => [(d.x), (d.y), d.size, id]))


    let edges = {
      sourcePositions: new Array(data.edges.length * 2).fill(0),
      targetPositions: new Array(data.edges.length * 2).fill(0),
      curves: new Array(data.edges.length * 2).fill(0)
    };
    data.edges.forEach((edge, idx) => {
      let source = data.nodes[edge.source], target = data.nodes[edge.target];

      edges.sourcePositions[idx*2] = (source.x)
      edges.sourcePositions[idx*2+1] = (source.y)
      edges.targetPositions[idx*2] = (target.x)
      edges.targetPositions[idx*2+1] = (target.y)

      edges.curves[idx] = {
        x1: (source.x),
        y1: (source.y),
        x2: (target.x),
        y2: (target.y),
      }
    });

    let edgeColors = new Array(data.edges.length * 3).fill(0);
    if (data.kmeans) {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        console.log(color)
        nodes.forEach(id => { data.nodes[id].color = color })
      })
    }

      data.edges.forEach((edge, idx) => {
        //console.log(`%c ${edge.target}`, 'background: green;');
        let color = (data.nodes[edge.source] ? data.nodes[edge.source] : getNode(edge.target)).color
        let c = d3.rgb(color);
        edgeColors[idx*3] = c.r / 255
        edgeColors[idx*3+1] = c.g / 255
        edgeColors[idx*3+2] = c.b / 255
    });

    let dates = data.nodes.map((d, idx) => {
      return d.create_time || (Math.random() * new Date());
    })
    let color = _.flatten(data.nodes.map((d) => {
      let c = d3.color(d.color || 'pink');
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let legend = Object.entries(data.kmeans || {}).map(d => d[1].color);

    let stateIndex = _.flatten(data.nodes.map((d) => {
      let c = d.color
      return legend.indexOf(c);
    }));

    window.x = {
      nodes: data.nodes,
      position,
      edges,
      edgeColors,
      color,
      dates,
      sentimentValue,
      stateIndex

  }
  return window.x
}

let favorites = []
let load = (url) => {
  if (url.includes('.tsv')) return loadTSV(window.location.tsv)
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
        window.graph = GraphRenderer.init({
          data: json,
          drawCurves: true,
          canvas: canvas,
          onClick: (point, idx, events) => {
            if (events.shiftKey)favorites = favorites.concat(idx)

            graph.setState({favorites})
          }
        })

    })
}
d3.select(window).on('load', main)
