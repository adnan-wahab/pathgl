module.exports = (regl, data) => {
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
  return     regl({
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
          position: data
        },

        uniforms: {
          color: [1, 0, 1],
          scale: 1,
          offset: [0, 0.0],
          phase: 0.0,
          freq: 0.01,
          opacity: .5
        },

        count: data.length / 4,
        primitive: 'points'
      })
}
