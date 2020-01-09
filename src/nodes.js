
let bunny = require('bunny');
let normals = require('angle-normals');
const createCamera = require('regl-camera')

let d3 = require('d3')

let h = (regl, attributes) => {
  const camera = createCamera(regl, {
  minDistance: 0.01,
  distance: 20,
  maxDistance: 30,
})
  let canvas = document.getElementsByTagName('canvas')[0]
  let fbo = regl.framebuffer({
    width: canvas.width,
    height: canvas.height,
    colorFormat: 'rgba',
  })
//
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

  function f(t) {
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
  }

  //return f

    return regl({
      frag: `
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      varying vec3 vColor;
      uniform float opacity;

      void main() {

        float r = 0.0;
        float delta = 0.0;
        float alpha = 1.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;

        // We can make circles by taking the dot product of a coordinate,
        // and discard any pixels that have a dot product greater than 1
        r = dot(cxy, cxy);

        delta = fwidth(r);

        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

        if (r > 1.0) {
          discard;
        }

        gl_FragColor = vec4(vColor * alpha, alpha);

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
      varying vec3 vColor;
      attribute vec3 color;

      void main() {
        vec2 p  = position;
        vColor = color;

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
        gl_Position = projection * view * vec4(p, -.5, 1);
      }`,
          uniforms: {
            scale: 1,
            offset: [0, 0.0],
            phase: 0.0,
            freq: 0.01,
            opacity: .5
          },
          attributes: attributes,
          count: attributes.position.length / 4,
          primitive: 'points'
        });
}
module.exports = h;
