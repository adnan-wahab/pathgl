const FRAG_SHADER = `
precision mediump float;
uniform vec4 color;
void main() {
  gl_FragColor = color;
}`

const VERT_SHADER = // Vertex shader from https://mattdesl.svbtle.com/drawing-lines-is-hard
`
uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform float aspectRatio;

uniform float width;
uniform int miter;

attribute vec3 prevPosition;
attribute vec3 currPosition;
attribute vec3 nextPosition;
attribute float offsetScale;

void main() {
  vec2 aspectVec = vec2(aspectRatio, 1.0);
  mat4 projViewModel = projection * view * model;
  vec4 prevProjected = projViewModel * vec4(prevPosition, 1.0);
  vec4 currProjected = projViewModel * vec4(currPosition, 1.0);
  vec4 nextProjected = projViewModel * vec4(nextPosition, 1.0);

  // get 2D screen space with W divide and aspect correction
  vec2 prevScreen = prevProjected.xy / prevProjected.w * aspectVec;
  vec2 currScreen = currProjected.xy / currProjected.w * aspectVec;
  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;

  // starting point uses (next - current)
  vec2 dir = vec2(0.0);
  if (currScreen == prevScreen) {
    dir = normalize(nextScreen - currScreen);
  }
  // ending point uses (current - previous)
  else if (currScreen == nextScreen) {
    dir = normalize(currScreen - prevScreen);
  }
  // somewhere in middle, needs a join
  else {
    // get directions from (C - B) and (B - A)
    vec2 dirA = normalize((currScreen - prevScreen));
    if (miter == 1) {
      vec2 dirB = normalize((nextScreen - currScreen));
      // now compute the miter join normal and length
      vec2 tangent = normalize(dirA + dirB);
      vec2 perp = vec2(-dirA.y, dirA.x);
      vec2 miter = vec2(-tangent.y, tangent.x);
      dir = tangent;
    } else {
      dir = dirA;
    }
  }

  vec2 normal = vec2(-dir.y, dir.x) * width;
  normal.x /= aspectRatio;
  vec4 offset = vec4(normal * offsetScale, 0.0, 0.0);
  gl_Position = currProjected + offset;
}`

const { push, unshift } = Array.prototype

const I = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT

const createMesh = (numPoints, width, buffer = []) => {
  for (let i = 0; i < numPoints - 1; i++) {
    const a = width + i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    buffer.push(a, b, c, c, b, d)
  }
  return buffer
}

const buffer = {
  duplicate (buffer, stride = 1, dupScale = 1) {
    const out = []
    const component = new Array(stride * 2)
    for (let i = 0, il = buffer.length / stride; i < il; i++) {
      const index = i * stride
      for (let j = 0; j < stride; j++) {
        const value = buffer[index + j]
        component[j] = value
        component[j + stride] = value * dupScale
      }
      push.apply(out, component)
    }
    return out
  },

  mapElement (buffer, elementIndex, stride, map) {
    for (let i = 0, il = buffer.length / stride; i < il; i++) {
      const index = elementIndex + i * stride
      buffer[index] = map(buffer[index], index, i)
    }
    return buffer
  },

  pushElement (buffer, elementIndex, stride) {
    const component = new Array(stride)
    const ai = elementIndex * stride
    for (let i = 0; i < stride; i++) {
      component[i] = buffer[ai + i]
    }
    push.apply(buffer, component)
    return buffer
  },

  // Copy a component to the beginning of the buffer
  unshiftElement (buffer, elementIndex, stride) {
    const component = new Array(stride)
    const ai = elementIndex * stride
    for (let i = 0; i < stride; i++) {
      component[i] = buffer[ai + i]
    }
    unshift.apply(buffer, component)
    return buffer
  },

  increaseStride (buffer, stride, newStride, undefValue = 0) {
    const out = []
    const component = new Array(newStride).fill(undefValue)
    for (let i = 0, il = buffer.length / stride; i < il; i++) {
      const index = i * stride
      for (let j = 0; j < stride; j++) {
        component[j] = buffer[index + j]
      }
      push.apply(out, component)
    }
    return out
  }
}

const createLine = (
  regl,
  {
    projection = I,
    model = I,
    view = I,
    points = [],
    widths = [],
    color = [0.8, 0.5, 0, 1],
    width = 1,
    miter = 1,
    is2d = false,
    zPos2d = 0
  } = {}
) => {
  if (!regl) {
    console.error('Regl instance is undefined.')
    return
  }

  let numPoints
  let numPointsTotal
  let pointsPadded
  let pointsDup
  let widthsDup
  let indices
  let pointBuffer
  let widthBuffer
  let attributes
  let elements
  let drawLine

  let dim = is2d ? 2 : 3

  const init = () => {
    pointBuffer = regl.buffer()

    widthBuffer = regl.buffer()

    attributes = {
      prevPosition: {
        buffer: () => pointBuffer,
        offset: 0,
        stride: FLOAT_BYTES * 3
      },
      currPosition: {
        buffer: () => pointBuffer,
        // note that each point is duplicated, hence we need to skip over the first two
        offset: FLOAT_BYTES * 3 * 2,
        stride: FLOAT_BYTES * 3
      },
      nextPosition: {
        buffer: () => pointBuffer,
        // note that each point is duplicated, hence we need to skip over the first four
        offset: FLOAT_BYTES * 3 * 4,
        stride: FLOAT_BYTES * 3
      },
      offsetScale: () => widthBuffer
    }

    elements = regl.elements()
    drawLine = regl({
      attributes,
      depth: { enable: !is2d },
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'one',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha'
        }
      },
      uniforms: {
        projection: (context, props) => context.projection || props.projection,
        model: (context, props) => context.model || props.model,
        view: (context, props) => context.view || props.view,
        aspectRatio: ({ viewportWidth, viewportHeight }) =>
          viewportWidth / viewportHeight,
        color: () => color,
        width: ({ viewportWidth }) =>
          (width / viewportWidth) * window.devicePixelRatio,
        miter
      },
      elements: () => elements,
      vert: VERT_SHADER,
      frag: FRAG_SHADER
    })
  }

  const prepare = () => {
    if (points.length % dim > 0) {
      console.warn(
        `The length of points (${numPoints}) does not match the dimensions (${dim}). Incomplete points are ignored.`
      )
    }

    // Copy all points belonging to complete points
    pointsPadded = points.slice(0, numPoints * dim)

    // Add the missing z point
    if (is2d) {
      pointsPadded = buffer.increaseStride(pointsPadded, 2, 3, zPos2d)
    }

    if (widths.length !== numPoints) widths = new Array(numPoints).fill(1)

    // duplicate the first and last point. E.g., [1,2,3] -> [1,1,2,3,3]
    // copy the last point to the end
    buffer.pushElement(pointsPadded, numPoints - 1, 3)
    // copy the first point to the beginning
    buffer.unshiftElement(pointsPadded, 0, 3)

    // duplicate each point for the positive and negative width (see below)
    pointsDup = new Float32Array(buffer.duplicate(pointsPadded, 3))
    // duplicate each width such that we have a positive and negative width
    widthsDup = buffer.duplicate(widths, 1, -1)
    // create the line mesh, i.e., the vertex indices
    indices = createMesh(numPoints, 0)

    pointBuffer({
      usage: 'dynamic',
      type: 'float',
      // 3 because its a 3-vector and 2 because each point is duplicated
      length: numPointsTotal * 3 * 2 * FLOAT_BYTES,
      data: pointsDup
    })

    widthBuffer({
      usage: 'dynamic',
      type: 'float',
      // 1 because its a scalar and 2 because each width is duplicated
      length: numPoints * 1 * 2 * FLOAT_BYTES,
      data: widthsDup
    })

    elements({
      primitive: 'triangles',
      usage: 'dynamic',
      type: 'uint16',
      data: indices
    })
  }

  const clear = () => {
    destroy()
    init()
  }

  const destroy = () => {
    points = null
    pointsPadded = null
    pointsDup = null
    widthsDup = null
    indices = null
    pointBuffer.destroy()
    widthBuffer.destroy()
    elements.destroy()
  }

  const draw = ({
    projection: newProjection,
    model: newModel,
    view: newView
  } = {}) => {
    // cache the view-defining matrices
    if (newProjection) {
      projection = newProjection
    }
    if (newModel) {
      model = newModel
    }
    if (newView) {
      view = newView
    }
    // only draw when some points have been specified
    if (points && points.length > 1) {
      drawLine({ projection, model, view })
    }
  }

  const getPoints = () => points

  const setPoints = (newPoints = [], newWidths = widths, newIs2d = is2d) => {
    points = newPoints
    is2d = newIs2d

    dim = is2d ? 2 : 3
    numPoints = Math.floor(points.length / dim)
    numPointsTotal = numPoints + 2

    if (newWidths.length === numPoints) widths = newWidths

    if (points && points.length > 1) {
      prepare()
    } else {
      clear()
    }
  }

  const getStyle = () => ({ color, miter, width })

  const setStyle = ({
    color: newColor,
    miter: newMiter,
    width: newWidth
  } = {}) => {
    if (newColor) color = newColor
    if (newMiter) miter = newMiter
    if (+newWidth > 0) width = newWidth
  }

  const getBuffer = () => ({
    points: pointBuffer,
    widths: widthBuffer
  })

  const getData = () => ({
    points: pointsDup,
    widths: widthsDup
  })

  // initialize parameters
  init()

  // prepare data if points are already specified
  if (points && points.length > 1) {
    setPoints(points)
  }

  return {
    clear,
    destroy,
    draw,
    getPoints,
    setPoints,
    getData,
    getBuffer,
    getStyle,
    setStyle
  }
}

export default createLine
