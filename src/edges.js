function createDrawLines(regl, options) {
  let attributes = options.attributes

  // make sure to respect system limitations.
  var lineWidth = 1
  if (lineWidth > regl.limits.lineWidthDims[1]) {
    lineWidth = regl.limits.lineWidthDims[1]
  }

  // this creates a drawCall that allows you to do draw single line primitive.
  let drawLines =
    regl({
      frag: `
      precision mediump float;
      varying vec3 v_color;
      varying vec3 wow;
      uniform float opacity;


      void main() {
        gl_FragColor = vec4(v_color + wow, .9);
      }`,

      vert: `
      varying vec3 v_color;

      precision mediump float;
      attribute vec2 position;
      attribute vec3 color;

      uniform mat4 projection, view;

      uniform float scale;
      uniform vec2 offset;
      uniform float tick;
      uniform float phase;

      uniform float freq;
      attribute float dates;

      varying vec3 wow;
      uniform vec2 selection;

      void main() {
        vec2 p  = position;

        if (selection.x < dates && dates < selection.y )
        wow = vec3(1);

        v_color = color;

        // translate
        p += offset;
        gl_PointSize = .5;
        gl_Position = projection * view * vec4(p, 0, 1);
      }`,
      blend: {
        enable: false,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha',
        },
      },
      depth: { enable: false },

      attributes: attributes,

      uniforms: {
        scale: 1,
        offset: [0, 0.0],
        phase: 0.0,
        freq: 0.01,
        opacity: .5,
        selection: () => {
          return window.getAdnan ?
           window.getAdnan() : [1,1]
        },
        view: () => {
          return   window.getView()
        }, projection: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]

      },

      lineWidth: lineWidth,
      count: attributes.position.length / 4,
      primitive: 'lines'
    })
    return drawLines;
}

export default createDrawLines
