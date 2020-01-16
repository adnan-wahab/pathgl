


let createRegl = require('regl');
let createCamera = require('regl-camera');
let bunny = require( 'bunny');
let normals = require('angle-normals');

const regl = createRegl()
const camera = createCamera(regl, {
  minDistance: 0.01,
  distance: 20,
  maxDistance: 30,
})

// ----------------------------------------------------------------------------------------- fbo

let canvas = document.getElementsByTagName('canvas')[0]
let fbo = regl.framebuffer({
  width: canvas.width,
  height: canvas.height,
  colorFormat: 'rgba',
})

const drawFboQuad = regl({
  vert: `
  precision mediump float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {

    // **   in the following formula there are some transformation factor because   **
    // **   the screen coordinates go                                               **
    // **   from [-1, -1, -1] to [1, 1, 1],                                         **
    // **   but texture coordinates go                                              **
    // **   from [0, 0] to [1, 1]                                                   **

    uv = (position + 1.0) / 2.0;
    gl_Position = vec4(1.0 * position, 0, 1);
  }`,

  frag: `
  precision mediump float;
  uniform sampler2D texture;

  varying vec2 uv;
  void main () {
    vec3 rgb = texture2D(texture, uv).rgb;
    gl_FragColor = vec4(rgb, 0.5);
  }`,

  attributes: {
    position: [
      -1, 1, -1, -1, 1, -1,
      -1, 1, 1, 1, 1, -1,
    ],
  },
  uniforms: {
    texture: fbo,
  },
  count: 6,

  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1,
    },
  },
})

// ----------------------------------------------------------------------------------------- bunny

const createBunny = function (regl) {
  const mesh = bunny

  const common = {
    vert: `
      precision mediump float;

      uniform mat4 projection, view;
      uniform vec3 translate;
      uniform float scale;

      attribute vec3 position, normal;

      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vNormal = normal;
        vec3 model = (position * scale + translate);
        gl_Position = projection * view * vec4(model, 1);
      }
    `,

    attributes: {
      position: mesh.positions,
      normal: normals(bunny.cells, bunny.positions),
    },
    elements: mesh.cells,

    uniforms: {
      translate: regl.prop('translate'),
      scale: regl.prop('scale'),
      color: regl.prop('color'),
    },
  }

  const draw = regl({
    ...common,
    frag: `
      precision mediump float;

      uniform vec3 color;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main () {
        gl_FragColor = vec4(max(vNormal, color), 1.0);
      }
    `,
    cull: {enable: true},
    depth: { enable: true, mask: true },
  })

  const drawFbo = regl({
    ...common,
    framebuffer: fbo,
    frag: `
      precision mediump float;
      uniform vec3 colorFbo;
      void main() {
        gl_FragColor = vec4(colorFbo, 1);
      }
    `,

    uniforms: {
      translate: regl.prop('translate'),
      scale: regl.prop('scale'),
      colorFbo: regl.prop('colorFbo'),
    },
  })

  return {
    draw,
    drawFbo,
  }
}

// ----------------------------------------------------------------------------------------- raf

const drawBunny = createBunny(regl)

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const randomTranslate = () => [
  randomIntFromInterval(-20, 20),
  randomIntFromInterval(-20, 20),
  randomIntFromInterval(-20, 20),
]

const numSource = 30
const bunnies = Array(numSource).fill().map((item, i) => ({
  translate: randomTranslate(),
  scale: Math.random() / 2,

  color: [-1, -1, -1],
  colorFbo: [0.0, (i + 1) / numSource, 0.0],
}))

let pickX = 0
let pickY = 0
document.onmousemove = function (e) {
  pickX = e.clientX
  pickY = e.clientY
}

window.onresize = function () {
  canvas = document.getElementsByTagName('canvas')[0]
  fbo.resize(canvas.width, canvas.height)
}

regl.frame(function ({tick}) {
  regl.clear({
    color: [0.1, 0.1, 0.1, 1],
    depth: true,
  })

  camera(() => {
    fbo.use(() => {
      regl.clear({
        color: [1, 0, 0, 1],
        depth: true,
      })
      drawBunny.drawFbo(bunnies)
    })

    let index = -1
    const stayInWidth = (pickX > 30 && pickX < canvas.width - 30)
    const stayInHeight = (pickY > 30 && pickY < canvas.height - 30)
    const compHeight = canvas.height - pickY
    const stayInComputerHeight = (compHeight > 30 && compHeight < canvas.height - 30)
    if (stayInWidth && stayInHeight && stayInComputerHeight) {
      try {
        const pixels = regl.read({
          x: pickX,
          y: canvas.height - pickY,
          width: 1,
          height: 1,
          data: new Uint8Array(6),
          framebuffer: fbo,
        })

        const greenValue = pixels[1]
        if (greenValue !== 0) {
          const value = (greenValue / 255) * (numSource)
          index = Math.round(value) - 1
        }
      } catch (e) {
        console.error(e)
      }
    }

    bunnies.forEach(b => { b.color = [-1, -1, -1] })
    if (index !== -1) {
      bunnies[index].color = [1, 1, 1]
    }

    drawBunny.draw(bunnies)

    drawFboQuad()
  })
})
