var isnumber = require('isnumber')

var Regl = require('regl')

const mat4 = require('gl-mat4')

let bunny = require('bunny')

function convertToRGB(data) { return [255, 0, 255] }

function Graph(positions, opts) {
  if (!(this instanceof Graph)) return new Graph(positions, opts)

  var self = this

  opts = opts || {}

  opts.background = opts.background || [0,0,0,1]
  opts.size = isnumber(opts.size) ? opts.size : 10

  var canvas = document.createElement('canvas')
  canvas.width = opts.width || 960
  canvas.height = opts.height || 500

  if (opts.root) opts.root.appendChild(canvas)

  var regl = Regl(canvas);

  var lines = regl({
    vert: `
    precision mediump float;
    attribute vec2 position;
    uniform mat4 projection, view;
    //attribute vec3 color;
    varying vec3 vcolor;
    void main() {
      //projection * view *  vec4(position.x, position.y , position.z, 1.);
        vcolor = vec3(position, 1.);
        gl_Position  = vec4(position.x, position.y, 0., 1.);
      //vcolor = color;
    }
    `,
    frag: `
    precision mediump float;
    varying vec3 vcolor;
    void main() {
      gl_FragColor = vec4(1, 1, 1., .81);
    }
    `,
    attributes: {
      position: regl.prop('position')
    },
    primitive: 'lines',
    count: positions.length,
    uniforms: {}
  })

  var buffer = { position: regl.buffer(positions) }
  regl({
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
      color: [0, 0, 0, 0]
    }
  })

  var draw = function (positions, colors) {
    regl.clear({
      color: opts.background.concat([1])
    })

    lines({ position: positions })
  }

  draw(buffer.position, buffer.color)
}

Graph.prototype.update = function (positions, colors) {}

module.exports = Graph
