let createDrawLines = require('./edges')
let createDrawNodes = require('./nodes')
let createCamera = require('./camera')

const mat4 = require('gl-mat4')
let createRegl = require('regl')



module.exports = (attributes, options) => {
  let regl = createRegl({
    extensions: ['OES_standard_derivatives']
  })

  let camera = createCamera(regl, {
    center: [0,0,0],
    phi: .1,
    distance:2,
    theta: -1.6
  })

  let drawLines = createDrawLines(regl, attributes)
  let drawNodes = createDrawNodes(regl, attributes, camera)
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

        drawNodes(options.data, options.onHover)

        //drawPickBuffer
      })
    })
  })
}
