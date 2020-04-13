// initialBackground = DEFAULT_COLOR_BG,
// initialBackgroundImage = DEFAULT_BACKGROUND_IMAGE,

  const background = toRgba(initialBackground, true)
  const backgroundImage = initialBackgroundImage
  const getBackgroundImage = () => backgroundImage

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
