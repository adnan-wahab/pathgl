// initialBackground = DEFAULT_COLOR_BG,
// initialBackgroundImage = DEFAULT_BACKGROUND_IMAGE,

  const background = toRgba(initialBackground, true)
  const backgroundImage = initialBackgroundImage
  const getBackgroundImage = () => backgroundImage
  const BG_FS = `
  precision mediump float;

  uniform sampler2D texture;

  varying vec2 uv;

  void main () {
    gl_FragColor = texture2D(texture, uv);
  }
  `
  const BG_VS = `
  precision mediump float;

  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;

  attribute vec2 position;

  varying vec2 uv;

  void main () {
    uv = position;
    gl_Position = projection * view * model *  vec4(1.0 - 2.0 * position, 0, 1);
  }
  `
  const drawBackgroundImage = regl({
    frag: BG_FS,
    vert: BG_VS,

    attributes: {
      position: [0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0]
    },

    uniforms: {
      projection: getProjection,
      model: getModel,
      view: getView,
      texture: getBackgroundImage
    },

    count: 6
  })
