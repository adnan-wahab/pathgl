var Bezier = require('bezier-js')

function createCurves (regl, attributes, getModel, getProjection, getView) {
  console.log(


    getModel(), getProjection(), getView()
  )
  if (! attributes.edges) return () => {}
  //attributes.edges = attributes.edges.filter((d, i) => )
  // make sure to respect system limitations.
  var lineWidth = 10
  if (lineWidth > regl.limits.lineWidthDims[1]) {
    lineWidth = regl.limits.lineWidthDims[1]
  }


  let positions = []


attributes.edges.curves.forEach((d, i ) => {
  var curve = new Bezier(d.x1, d.y1 , d.x2, d.y1 , d.x2, d.y2);
  var LUT = curve.getLUT(16);
  LUT.forEach(function(p) { positions.push(p.x, p.y) });
  //LUT.forEach(function(p) { positions.push(Math.random(), Math.random()) });

})

//window.positions = positions




    let draw = regl({
      frag: `
      precision mediump float;
      varying vec3 v_color;

      uniform float opacity;
      uniform bool edgeColors;


      void main() {
              gl_FragColor = vec4(1,1,1, 1);
      }`,

      vert: `
      varying vec3 v_color;

      precision mediump float;
      attribute vec2 position;

      attribute vec2 sourcePositions;
      attribute vec2 targetPositions;

      //attribute vec3 color;

      uniform mat4 projection, view;
      uniform mat4 model;

      uniform float scale;
      uniform float tick;
      attribute float dates;
      uniform float freq;

      uniform vec2 selection;

      void main() {
        vec2 p  = position;

        gl_Position = projection * view * model * vec4(p, 0, 1);
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
      //depth: { enable: true },

      attributes: {
        position: {
           buffer: positions
        }
      },

      uniforms: {
        edgeColors: regl.prop('edgeColors'),
        size: [window.innerWidth, window.innerHeight],
        opacity: 0.5,
        view: getView,
        projection: getProjection,
        model: getModel,
      },
      count: positions.length / 2,
      lineWidth: lineWidth,

      primitive: 'line strip',

    })

    return draw
}

export default createCurves
