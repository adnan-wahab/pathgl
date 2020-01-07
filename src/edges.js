var isnumber = require('isnumber')

var regl = require('regl')()

const mat4 = require('gl-mat4')

const camera = require('./camera')(regl, {
  center: [0,0,0],
  phi: .1,
  distance:2,
  theta: -1.6
})
let magic = [
 -0.9961216449737549,
 0.012064366601407528,
 -0.08715581148862839
]
function convertToRGB(data) { return [255, 0, 255] }

function makeCircle (N) { // where N is tesselation degree.
  return Array(N).fill().map((_, i) => {
    var phi = 2 * Math.PI * (i / N)
    return [Math.cos(phi), Math.sin(phi)]
  })
}


function Graph(data, opts) {

  var mat4 = require('gl-mat4')

  var globalState = regl({
    uniforms: {
      tick: ({tick}) => tick,
      projection: ({viewportWidth, viewportHeight}) =>
        mat4.perspective([],
                         Math.PI / 2,
                         viewportWidth / viewportHeight,
                         0.01,
                         1000),
      //view: mat4.lookAt([], [2.1, 0, 1.3], [0, 0.0, 0], [0, 0, 1])
    },
    frag: `
    precision mediump float;
    uniform vec3 color;
    uniform float opacity;

    void main() {
      gl_FragColor = vec4(color, opacity);
    }`,

    vert: `

    precision mediump float;
    attribute vec2 position;

    uniform mat4 projection, view;

    uniform float scale;
    uniform vec2 offset;
    uniform float tick;
    uniform float phase;
    uniform float freq;

    void main() {
      vec2 p  = position;

      // scale
      p *= scale;

      // rotate
      float phi = //tick *
      freq + phase;
      p = vec2(
        dot(vec2(+cos(phi), -sin(phi)), p),
        dot(vec2(+sin(phi), +cos(phi)), p)
      );

      // translate
      p += offset;
      gl_PointSize = 10.0;
      gl_Position = projection * view * vec4(p, 0, 1);
    }`
  })

  // make sure to respect system limitations.
  var lineWidth = 3
  if (lineWidth > regl.limits.lineWidthDims[1]) {
    lineWidth = regl.limits.lineWidthDims[1]
  }

  // this creates a drawCall that allows you to do draw single line primitive.
  function createDrawCall (props) {
    console.log(props.opa)
    return regl({
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src color',
          dstRGB: 'one',
          dstAlpha: 'one',
          equation: 'add',
          color: [0, 0, 0, 0]
        },
      },
      attributes: {
        position: props.position
      },

      uniforms: {
        color: props.color,
        scale: props.scale,
        offset: props.offset,
        phase: props.phase,
        freq: props.freq,
        opacity: props.opa || .5
      },

      lineWidth: lineWidth,
      count: props.count || props.position.length,
      primitive: props.primitive
    })
  }

  var drawCalls = []
  var i

  drawCalls.push(createDrawCall({
    color: [1, 1, 0.3],
    primitive: 'lines',
    scale: 1,
    offset: [0, 0.0],
    phase: 0.0,
    freq: 0.01,
    position: data,
    count: data.length / 4,
    opa: 0
  }))

  drawCalls.push(createDrawCall({
    color: [1, 1, 0.3],
    primitive: 'points',
    scale: 1,
    offset: [0, 0.0],
    phase: 0.0,
    freq: 0.01,
    position: data,
    count: data.length / 4,
    opa: 0
  }))



  regl.frame(({tick}) => {
    camera((state)=> {
      //if (!state.dirty) return;
      window.state = state
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1
      })

      globalState(() => {
        for (i = 0; i < drawCalls.length; i++) {
          drawCalls[i]()
        }
      })
    })
  })
}

Graph.prototype.update = function (positions, colors) {}

module.exports = Graph
