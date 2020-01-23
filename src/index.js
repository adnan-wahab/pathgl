let createDrawLines = require('./edges')
let createDrawNodes = require('./nodes')
let createCamera = require('./camera')
let _ = require('lodash')
let d3 = require('d3')

const mat4 = require('gl-mat4')
let createRegl = require('regl')
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
      fboColor
    }
  }

module.exports.init = (options) => {
  options.canvas = options.canvas || function () {}
  options.attributes = processKMeans(options.data)
  let regl = createRegl({
    canvas: options.canvas,
    extensions: ['OES_standard_derivatives']
  })

  let camera = createCamera(regl, {
    center: [0,0,0],
    phi: .1,
    distance:2,
    theta: -1.6
  })

  let drawLines = createDrawLines(regl, options)
  let drawNodes = createDrawNodes(regl, options)

  var globalState = regl({
    uniforms: {
      tick: ({tick}) => tick,
      projection: ({viewportWidth, viewportHeight}) =>
        mat4.perspective([],
                         Math.PI / 2,
                         viewportWidth / viewportHeight,
                         0.01,
                         1000),
    },

  })

  regl.frame(({tick}) => {
    camera((state)=> {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })
      globalState(() => {
        drawLines()
        drawNodes()
        //console.log('this should work')

        //drawPickBuffer
      })
    })
  })

  return {
    paint: () => {},
    setOptions: () => {}
  }
}
