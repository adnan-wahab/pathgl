var Bezier = require('bezier-js')

function createDrawLines (regl, attributes, getModel, getProjection, getView) {
  window.attr = attributes
  if (! attributes.edges) return () => {}
  //attributes.edges = attributes.edges.filter((d, i) => )
  // make sure to respect system limitations.
  var lineWidth = 10
  if (lineWidth > regl.limits.lineWidthDims[1]) {
    lineWidth = regl.limits.lineWidthDims[1]
  }

  var curve = new Bezier(-1, -1 , 1, -1 , 1, 1);
  let points = []
  var b = function() {
    var LUT = curve.getLUT(16);
    LUT.forEach(function(p) {points.push(p.x, p.y) });
  }

  b()
  console.log(points, 'points')


    let draw = regl({
      frag: `
      precision mediump float;
      varying vec3 v_color;
      varying vec3 wow;
      uniform float opacity;
      uniform bool edgeColors;


      void main() {
              gl_FragColor = vec4(1,1,1, 1);
      //   if ( edgeColors)
      // gl_FragColor = vec4(v_color, .5);
      // else
      // gl_FragColor = vec4(1,1,1, 1);
      }`,

      vert: `
      varying vec3 v_color;

      precision mediump float;
      attribute vec2 sourcePositions;
      //attribute vec2 targetPositions;
      //attribute vec3 color;

      uniform mat4 projection, view;
      uniform mat4 model;

      uniform float scale;
      uniform vec2 offset;
      uniform float tick;


      uniform vec2 size;

      uniform float freq;
      attribute float dates;

      varying vec3 wow;
      uniform vec2 selection;

      void main() {
        vec2 p  = sourcePositions;

        //v_color = color;

        gl_Position = projection * view * model * vec4(p , 0, 1);
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
        sourcePositions:  () => points,
        //targetPositions: () => attributes.edges.targetPositions,
          // color: {
          //   buffer: () => attributes.edgeColors,
          //   offset: 0
          // }
      },

      uniforms: {
        edgeColors: regl.prop('edgeColors'),
        scale: 1,
        size: [window.innerWidth, window.innerHeight],
        offset: [0, 0.0],
        phase: 0.0,
        freq: 0.01,
        opacity: 0.5,
        selection: () => {
          return window.getAdnan
            ? window.getAdnan() : [1, 1]
        },
        view: getView,
        projection: getProjection,
        model: getModel,
      },

      lineWidth: lineWidth,
      count: () => 10 ,
      primitive: 'line strip',
      offset: 1,
    })

    return draw
}

export default createDrawLines
