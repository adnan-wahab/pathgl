
let bunny = require('bunny');
let normals = require('angle-normals');

let d3 = require('d3')

let h = (regl, options) => {
  let attributes = options.attributes,
      canvas = options.canvas,
      nodes = options.data.nodes;


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

    const common = {
      vert: `

      precision mediump float;
      attribute vec2 position;

      uniform mat4 projection, view;

      uniform vec2 offset;

      varying vec3 vColor;
      attribute vec3 color;
      attribute vec3 fboColor;
      uniform bool isFbo;


      void main() {
        vec2 p  = position;
        vColor = isFbo ? fboColor : color;
        gl_PointSize = 10.0;
        gl_Position = projection * view * vec4(p, -.001, 1);
      }`,

      attributes: attributes,
      primitive: 'points',
      count: attributes.position.length / 4,
    }

    const draw = regl({
      ...common,
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
      uniforms: {isFbo:false},
      cull: {enable: true},
      depth: { enable: true, mask: true },
      blend: {
        enable: false,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
    })

    const drawFbo = regl({
      ...common,
      framebuffer: fbo,
      uniforms: {isFbo:true},

      frag: `
        precision mediump float;
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1);
        }
      `
    })
    return {
      draw,
      drawFbo,
    }
  }
  // ----------------------------------------------------------------------------------------- raf

  const drawBunny = createBunny(regl)

  let pickX = 0
  let pickY = 0
  document.onmousemove = function (e) {
    pickX = e.clientX
    pickY = e.clientY
  }

  window.onresize = function () {
    fbo.resize(canvas.width, canvas.height)
  }

  return function () {
    // regl.clear({
    //   color: [0.1, 0.1, 0.1, 1],
    //   depth: true,
    // })

    fbo.use(() => {
      regl.clear({
        color: [1, 0, 0, 1],
        depth: true,
      })
      drawBunny.drawFbo()
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
            const value = (greenValue / 255) * (nodes.length)
            index = Math.round(value) - 1
            options.onHover(nodes[index])
          }
        } catch (e) {
          console.error(e)
        }
      }

    drawBunny.draw()
    //drawFboQuad()

  }
}
module.exports = h;
