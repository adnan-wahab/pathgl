function createDrawLines (regl, options) {
  const attributes = options.attributes
  console.log(options)
  // make sure to respect system limitations.
  var lineWidth = 1
  if (lineWidth > regl.limits.lineWidthDims[1]) {
    lineWidth = regl.limits.lineWidthDims[1]
  }
window.x = attributes
console.log('making drawLines', options)
  // this creates a drawCall that allows you to do draw single line primitive.
  const drawLines =
    regl({
      frag: `
      precision mediump float;
      varying vec3 v_color;
      varying vec3 wow;
      uniform float opacity;


      void main() {
        gl_FragColor = vec4(1);
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

        // if (selection.x < dates && dates < selection.y )
        // wow = vec3(0);
        // else wow = vec3(1);
        // v_color = color;

        // translate
        p += offset;
        gl_Position = projection * view * vec4(p, 0, 1);
      }`,
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha'
        }
      },
      depth: { enable: true },

      attributes: {
        position:  attributes.edges,
          color: attributes.edgeColors
      },

      uniforms: {
        scale: 1,
        offset: [0, 0.0],
        phase: 0.0,
        freq: 0.01,
        opacity: 0.5,
        selection: () => {
          return window.getAdnan
            ? window.getAdnan() : [1, 1]
        },
        view: () => {
          return window.getView()
        },
        projection: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

      },

      lineWidth: lineWidth,
      count: attributes.position.length /4 ,
      primitive: 'lines'
    })



  return () => {drawLines()}
}

export default createDrawLines
