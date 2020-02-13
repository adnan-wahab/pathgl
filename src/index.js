import createDom2dCamera from 'dom-2d-camera';
import KDBush from 'kdbush'
import withThrottle from 'lodash-es/throttle'
import withRaf from 'with-raf'
import { mat4, vec4 } from 'gl-matrix'
import _ from 'lodash'
import * as d3 from 'd3'
import createLine from './lines'
import createDrawLines from './edges'
import createDrawNodes from './nodes'

import {
  COLOR_ACTIVE_IDX,
  COLOR_BG_IDX,
  COLOR_HOVER_IDX,
  COLOR_NORMAL_IDX,
  COLOR_NUM_STATES,
  DEFAULT_BACKGROUND_IMAGE,
  DEFAULT_COLOR_BG,
  DEFAULT_COLOR_BY,
  DEFAULT_COLORS,
  DEFAULT_DATA_ASPECT_RATIO,
  DEFAULT_DISTANCE,
  DEFAULT_HEIGHT,
  DEFAULT_SHOW_RECTICLE,
  DEFAULT_RECTICLE_COLOR,
  DEFAULT_POINT_OUTLINE_WIDTH,
  DEFAULT_POINT_SIZE,
  DEFAULT_POINT_SIZE_SELECTED,
  DEFAULT_ROTATION,
  DEFAULT_TARGET,
  DEFAULT_VIEW,
  DEFAULT_WIDTH,
  FLOAT_BYTES
} from './constants'

import {
  checkReglExtensions,
  createRegl,
  createTextureFromUrl,
  dist,
  getBBox,
  isRgb,
  isPointInPolygon,
  isRgba,
  toRgba,
  max,
  min
} from './utils'

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

const POINT_FS = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;
uniform vec2 selection;

varying vec4 vColor;

void main() {
  float r = 0.0, delta = 0.0, alpha = 1.0;
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  r = dot(cxy, cxy);

  #ifdef GL_OES_standard_derivatives
    delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
  #endif

  gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
}
`
const POINT_VS = `
precision mediump float;
uniform float pointSize;
uniform float pointSizeExtra;
uniform float numPoints;
uniform float scaling;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

attribute vec3 pos;
attribute vec3 color;

uniform bool flatSize;

// variables to send to the fragment shader
varying vec4 vColor;

void main() {
  gl_Position = projection * view * model * vec4(pos.xy, 0.0, 1.0);

  vColor = vec4(color, 1);

  float finalScaling = min(1.0, scaling) + log2(max(1.0, scaling));
  //if (flatSize)
  gl_PointSize = (pointSize) * finalScaling + pointSizeExtra;
  //else
  //gl_PointSize = (pos.z * .5) + pointSizeExtra;

  gl_PointSize = pointSize * finalScaling + pointSizeExtra;
}
`
const NOOP = () => {}

const creategraph = (options) => {
  let state = {scaling: .4, numPoints: 1, showLines: false, showNodes: true, flatSize: true }
  let initialRegl = options.regl,
  initialBackground = DEFAULT_COLOR_BG,
  initialBackgroundImage = DEFAULT_BACKGROUND_IMAGE,
  initialCanvas = options.canvas,
  initialShowRecticle = DEFAULT_SHOW_RECTICLE,
  initialRecticleColor = DEFAULT_RECTICLE_COLOR,
  initialPointSize = DEFAULT_POINT_SIZE,
  initialPointSizeSelected = DEFAULT_POINT_SIZE_SELECTED,
  initialPointOutlineWidth = 2,
  initialWidth = DEFAULT_WIDTH,
  initialHeight = DEFAULT_HEIGHT,
  initialTarget = DEFAULT_TARGET,
  initialDistance = DEFAULT_DISTANCE,
  initialRotation = DEFAULT_ROTATION,
  initialView = DEFAULT_VIEW,
  drawLines = createDrawLines(options.regl, options),
  drawNodes = options.createDrawNodes || NOOP,
  onHover = options.onHover || NOOP,
  onClick = options.onClick || NOOP,
  attributes = options.attributes;
  const scratch = new Float32Array(16);
  let mousePosition  = [0, 0];
  let pointList = []
  window.getMousePosition = () => mousePosition
  checkReglExtensions(initialRegl)

  const background = toRgba(initialBackground, true)
  const backgroundImage = initialBackgroundImage
  let canvas = initialCanvas
  let width = initialWidth
  let height = initialHeight
  const pointSize = initialPointSize
  const pointSizeSelected = initialPointSizeSelected
  const pointOutlineWidth = initialPointOutlineWidth
  let regl = initialRegl || createRegl(initialCanvas)
  let camera
  let scroll
  let mouseDown = false
  let mouseDownShift = false
  let mouseDownPosition = [0, 0]
  let numPoints = 0
  let selection = []
  let searchIndex
  let viewAspectRatio
  const dataAspectRatio = DEFAULT_DATA_ASPECT_RATIO
  let projection
  let model
  const showRecticle = initialShowRecticle
  let recticleHLine
  let recticleVLine
  const recticleColor = toRgba(initialRecticleColor, true)

  let isViewChanged = false
  let isInit = false

  const opacity = 1

  let hoveredPoint
  let isMouseInCanvas = false

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice()
  const getNdcX = x => -1 + (x / width) * 2
  const getNdcY = y => 1 + (y / height) * -2

  // Get relative WebGL position
  const getMouseGlPos = () => [
    getNdcX(mousePosition[0]),
    getNdcY(mousePosition[1])
  ]

  const getScatterGlPos = () => {
    const [xGl, yGl] = getMouseGlPos()

    // Homogeneous vector
    const v = [xGl, yGl, 1, 1]

    // projection^-1 * view^-1 * model^-1 is the same as
    // model * view^-1 * projection
    const mvp = mat4.invert(
      scratch,
      mat4.multiply(
        scratch,
        projection,
        mat4.multiply(scratch, camera.view, model)
      )
    )
    window.view = camera.view
    // Translate vector
    vec4.transformMat4(v, v, mvp)

    return v.slice(0, 2)
  }

  const raycast = () => {
    let pointSize = 100; //MAD HACKS
    const [x, y] = getScatterGlPos()
    const scaling = 1 || camera.scaling

    const scaledPointSize =
      2 *
      pointSize *
      (min(1.0, scaling) + Math.log2(max(1.0, scaling))) *
      window.devicePixelRatio

    const xNormalizedScaledPointSize = scaledPointSize / width
    const yNormalizedScaledPointSize = scaledPointSize / height

    // Get all points within a close range
    const pointsInBBox = searchIndex.range(
      x - xNormalizedScaledPointSize,
      y - yNormalizedScaledPointSize,
      x + xNormalizedScaledPointSize,
      y + yNormalizedScaledPointSize
    )
    //console.log(pointsInBBox)
    // Find the closest point
    let minDist = scaledPointSize
    let clostestPoint

    pointsInBBox.forEach(idx => {
      const [ptX, ptY] = searchIndex.points[idx]
      const d = dist(ptX, ptY, x, y)
      if (d < minDist) {
        minDist = d
        clostestPoint = idx
      }
    })
    return clostestPoint
    if (minDist < (pointSize / width) * 2) {
      return clostestPoint
    };
    return -1
  }

  const deselect = () => {
    // if (selection.length) {
    //   selection = []
    //   drawRaf() // eslint-disable-line no-use-before-define
    // }
  }

  const selectPoint = () => {}
  const selectSubGraph = () => {}
  const selectCluster = (points) => {
    console.log( points.map(point => pointList.findIndex(d => d[2] === point)))
    selection = points.map(point => pointList.findIndex(d => d[2] === point))
    drawRaf() // eslint-disable-line no-use-before-define
  }

  const select = (points ) => {
      if (typeof points === 'string') selection = [pointList.findIndex(d => d[2] === points)]
      else selection = points

    drawRaf() // eslint-disable-line no-use-before-define
  }

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect()

    mousePosition[0] = event.clientX - rect.left
    mousePosition[1] = event.clientY - rect.top

    return [...mousePosition]
  }

  const mouseDownHandler = event => {
    if (!isInit) return
    mouseDown = true

    mouseDownPosition = getRelativeMousePosition(event)
    mouseDownShift = event.shiftKey

    // fix camera
    if (mouseDownShift) camera.config({ isFixed: true })
  }

  const mouseUpHandler = () => {
    if (!isInit) return

    mouseDown = false

    if (mouseDownShift) {
      mouseDownShift = false
      camera.config({ isFixed: false })
    }
  }

  const mouseClickHandler = event => {
    if (!isInit) return

    const currentMousePosition = getRelativeMousePosition(event)
    const clickDist = dist(...currentMousePosition, ...mouseDownPosition)
    const clostestPoint = raycast()
    if (clostestPoint >= 0) select([clostestPoint])
    if (clostestPoint >= 0) onClick(pointList[clostestPoint])
  }

  const mouseDblClickHandler = () => {
    deselect()
  }

  const mouseMoveHandler = event => {
    if (!isInit) return

    getRelativeMousePosition(event)
    // Only ray cast if the mouse cursor is inside
    //if (isMouseInCanvas && !mouseDownShift) {
      const clostestPoint = raycast()
      hover(clostestPoint) // eslint-disable-line no-use-before-define
    //}
    // Always redraw when mouse as the user might have panned
    if (mouseDown) drawRaf() // eslint-disable-line no-use-before-define
  }

  const updateViewAspectRatio = () => {
    viewAspectRatio = width / height
    projection = mat4.fromScaling([], [1 / viewAspectRatio, 1, 1])
    model = mat4.fromScaling([], [dataAspectRatio, 1, 1])
  }

  const setHeight = newHeight => {
    if (!+newHeight || +newHeight <= 0) return
    height = +newHeight
    canvas.height = height * window.devicePixelRatio
  }

  const setWidth = newWidth => {
    if (!+newWidth || +newWidth <= 0) return
    width = +newWidth
    canvas.width = width * window.devicePixelRatio
  }

  const getBackgroundImage = () => backgroundImage
  const getPointSize = () => pointSize * window.devicePixelRatio
  const getNormalPointSizeExtra = () => 0
  const getProjection = () => projection
  window.getView = () => camera.view
  const getPositionBuffer = () => {
    return attributes.position
  }
  const getModel = () => model
  const getScaling = () => state.scaling
  const getNormalNumPoints = () => numPoints * state.numPoints | 0
  window.getNormalNumPoints = getNormalNumPoints
  window.getScaling = getScaling
  let hi = 'cluster'
  window.onStyleChange = (prop) => {
    console.log('onStyleChange', hi)
    hi = prop
  }

  const drawPoints = (
    getPos,
    getPointSizeExtra,
    getNumPoints,
    getColors = () => hi == 'cluster' ? attributes.color : attributes.sentimentValue
  ) =>
    regl({
      frag: POINT_FS,
      vert: POINT_VS,

      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'one',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha'
        }
      },

      depth: { enable: false },

      attributes: {
        pos: {
          buffer: getPos,
          size: 3
        },
        color: {
          buffer: getColors,
          size: 3
        }
      },

      uniforms: {
        projection: getProjection,
        model: getModel,
        view: getView,
        scaling: getScaling,
        pointSize: getPointSize,
        pointSizeExtra: getPointSizeExtra,
        flatSize: () => {return state.flatSize }
      },

      count: getNumPoints,

      primitive: 'points'
    })

  const drawPointBodies = drawPoints(
    getPositionBuffer,
    getNormalPointSizeExtra,
    getNormalNumPoints
  )

  const drawHoveredPoint = () => {
    const idx = hoveredPoint

    const numOutlinedPoints = 1
    const xy = searchIndex.points[idx]
console.log('OMG WHY', idx, xy)
    const c = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 0]
    ]

    const colors = (i) => {
      return c[i]
    }

    drawPoints(
      xy,

      () =>
        (pointSizeSelected + pointOutlineWidth * 2) * window.devicePixelRatio,
      () => numOutlinedPoints,
      colors(0)
    )()

    drawPoints(
      xy,

      () =>
        pointSizeSelected,
      () => numOutlinedPoints,
      colors(1)
    )()

  }

  const drawSelectedPoint = () => {
    const idx = selection[0]
    const numOutlinedPoints = selection.length
    const xy = searchIndex.points[idx]

    const c = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ]

    const colors = (i) => {
      return c[i]
    }
    // Draw outer outline
    drawPoints(
      xy,

      () =>
        (pointSizeSelected + pointOutlineWidth * 2) * window.devicePixelRatio,
      () => numOutlinedPoints,
      colors(0)
    )()

    // Draw inner outline
    drawPoints(
      xy,
      () => (pointSizeSelected + pointOutlineWidth) * window.devicePixelRatio,
      () => numOutlinedPoints,
      colors(1)
    )()

    // Draw body
    drawPoints(
      xy,
      () => pointSizeSelected,
      () => numOutlinedPoints,
      colors(2)
    )()
  }

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

  window.tooltip = (x, y) => {

    let v = [x, y, 0, 1]
    mat4.multiply(
      scratch,
      projection,
      mat4.multiply(scratch, camera.view, model)
    )

    vec4.transformMat4(v, v, scratch)
    console.log(v)

  }

  const drawRecticle = () => {
    if (!(hoveredPoint >= 0)) return

    const [x, y] = searchIndex.points[hoveredPoint].slice(0, 2)

    // Normalized device coordinate of the point
    const v = [x, y, 0, 1]

    // We have to calculate the model-view-projection matrix outside of the
    // shader as we actually don't want the mode, view, or projection of the
    // line view space to change such that the recticle is visualized across the
    // entire view container and not within the view of the graph
    mat4.multiply(
      scratch,
      projection,
      mat4.multiply(scratch, camera.view, model)
    )

    vec4.transformMat4(v, v, scratch)

    recticleHLine.setPoints([-1, v[1], 1, v[1]])
    recticleVLine.setPoints([v[0], 1, v[0], -1])

    recticleHLine.draw()
    recticleVLine.draw()

    const fromage = [
      [1, 1, 1],
      [1, 0, 1]
    ]

    // Draw outer outline
    drawPoints(
      () => [x, y],
      () =>
        (pointSizeSelected + pointOutlineWidth * 2) * window.devicePixelRatio,
      () => 1,
      () => fromage[0]
    )()

    // Draw inner outline
    drawPoints(
      () => [x, y],
      () => (pointSizeSelected + pointOutlineWidth) * window.devicePixelRatio,
      () => 1,
      () => fromage[1]
    )()
  }

  const setPoints = newPoints => {
    isInit = false
    pointList = newPoints
    numPoints = newPoints.length

    searchIndex = new KDBush(newPoints, p => p[0], p => p[1], 16)

    isInit = true
  }

  const draw = () => {
    if (!isInit) return

    regl.clear({
      // background color (transparent)
      color: [0, 0, 0, 0],
      depth: 1
    })

    // Update camera
    isViewChanged = camera.tick()

    if (backgroundImage) {
      drawBackgroundImage()
    }
    if (state.showLines) drawLines()
    //drawNodes({view: getView(), projection: getView()})

    // The draw order of the following calls is important!

    if (state.showNodes) drawPointBodies();

    drawRecticle();

    if (hoveredPoint >= 0) drawHoveredPoint();

    if (selection.length) drawSelectedPoint();


    // Publish camera change
    // if (isViewChanged) pubSub.publish('view', camera.view)
  }

  const drawRaf = withRaf(draw)

  const withDraw = f => (...args) => {
    const out = f(...args)
    drawRaf()
    return out
  }

  /**
   * Update Regl's viewport, drawingBufferWidth, and drawingBufferHeight
   *
   * @description Call this method after the viewport has changed, e.g., width
   * or height have been altered
   */
  const refresh = () => {
    regl.poll()
    camera.refresh()
  }

  const set = ({
    height: newHeight = null,
    width: newWidth = null
  } = {}) => {
    setHeight(newHeight)
    setWidth(newWidth)

    updateViewAspectRatio()
    camera.refresh()
    refresh()
    drawRaf()
  }

  const hover = (point) => {
    let needsRedraw = false

    if (point >= 0) {
      needsRedraw = true
      const newHoveredPoint = point !== hoveredPoint
      hoveredPoint = point
      onHover(point)
    } else {
      // needsRedraw = hoveredPoint
      // hoveredPoint = undefined
      if (+needsRedraw >= 0) options.deselect()
    }

    if (needsRedraw) drawRaf(null)
  }

  const reset = () => {
    if (initialView) camera.set(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
    //pubSub.publish('view', camera.view)
  }

  const mouseEnterCanvasHandler = () => {
    isMouseInCanvas = true
  }

  const mouseLeaveCanvasHandler = () => {
    hover()
    isMouseInCanvas = false
    drawRaf()
  }
  const wheelHandler = () => {
    drawRaf();
  };

  const initCamera = () => {
    camera = createDom2dCamera(canvas)

    if (initialView) camera.set(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
  }

  const init = () => {
    updateViewAspectRatio()
    initCamera()

    recticleHLine = createLine(regl, {
      color: recticleColor,
      width: 1,
      is2d: true
    })
    recticleVLine = createLine(regl, {
      color: recticleColor,
      width: 1,
      is2d: true
    })

    // Set dimensions
    set({ width, height })

    // Setup event handler
    //window.addEventListener('blur', blurHandler, false);
    window.addEventListener('mousedown', mouseDownHandler, false)
    window.addEventListener('mouseup', mouseUpHandler, false)
    window.addEventListener('mousemove', mouseMoveHandler, false)
    canvas.addEventListener('mouseenter', mouseEnterCanvasHandler, false)
    canvas.addEventListener('mouseleave', mouseLeaveCanvasHandler, false)
    canvas.addEventListener('click', mouseClickHandler, false)
    // canvas.addEventListener('dblclick', mouseDblClickHandler, false);
    canvas.addEventListener('wheel', wheelHandler);
    const points = options.data ? options.data.nodes
      .map((d, idx) => {
        return [clip(d.x), clip(d.y), d.uuid]
      }) : new Array(1e5).fill(10)

    setPoints(points)
  }

  const destroy = () => {
    // window.removeEventListener('blur', blurHandler, false);
    // window.removeEventListener('mousedown', mouseDownHandler, false);
    // window.removeEventListener('mouseup', mouseUpHandler, false);
    // window.removeEventListener('mousemove', mouseMoveHandler, false);
    // canvas.removeEventListener('mouseenter', mouseEnterCanvasHandler, false);
    // canvas.removeEventListener('mouseleave', mouseLeaveCanvasHandler, false);
    // canvas.removeEventListener('click', mouseClickHandler, false);
    // canvas.removeEventListener('dblclick', mouseDblClickHandler, false);
    canvas = undefined
    camera = undefined
    regl = undefined
  }

  init(canvas)

  const update = (options) => {
    state.scaling = options.zoom
    state.numPoints = options.numNodes
    state.showLines = options.showLines
    state.showNodes = options.showNodes
    state.flatSize = options.flatSize
    drawRaf()

    console.log('updating', state.numPoints)
  }

  return {
    deselect,
    destroy,
    draw: drawRaf,
    repaint: () => {
      withDraw(reset)();
    },
    hoverPoint: (uuid) => {
      console.log('uid', uuid,  pointList.findIndex(d => d[2] === uuid))
      hoveredPoint = pointList.findIndex(d => d[2] === uuid)
      console.log(hoveredPoint)
          draw()
    },
    refresh,
    reset: withDraw(reset),
    select,
    selectCluster,
    update
  }
}

const clip = (d) => {
  return d / 3000
}

let processKMeans = (data) => {

let getNode = (id) => {
  return data.nodes.find(d => d.uuid === id)
}

 let colors = data.nodes.map(d => {
   return [Math.random(), ]
 })

  let position = _.flatten(data.nodes.map(d => [clip(d.x), clip(d.y), d.size ]))
  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentimentValue = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  let counts = {}
  data.edges.forEach(d => {
    counts[d.target] = counts[d.target]
  })
  console.log('counts', counts)

    let edges = new Array(data.edges.length * 4).fill(0);
    data.edges.forEach((edge, idx) => {
      edges[idx*4] = clip(getNode(edge.source).x)
      edges[idx*4+1] = clip(getNode(edge.source).y)
      edges[idx*4+2] = clip(getNode(edge.target).x)
      edges[idx*4+3] = clip(getNode(edge.target).y)
    });

    let edgeColors = new Array(data.edges.length * 3).fill(0);
    if (data.kmeans) {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        nodes.forEach(id => getNode(id).color = color)

      })
    } else {
      data.edges.forEach((edge, idx) => {
      let color = data.nodes[edge.source].color
      let c = d3.rgb(color);
      edgeColors[idx*4+1] = c.r / 255
      edgeColors[idx*4+2] = c.g / 255
      edgeColors[idx*4+3] = c.b / 255
    });
  }

    let dates = data.nodes.map((edge, idx) => {
      return edge.attributes.date
    })
    let color = _.flatten(data.nodes.map((d) => {
      let c = d3.color(d.color || 'pink');
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let fboColor = color.map((d, i) => {
      return i / color.length
    })
    return {
      position,
      counts,
      edges,
      edgeColors,
      color,
      //dates,
      fboColor,
      sentimentValue
    }
  }

const init = (props) => {
  if (props.data) props.attributes = processKMeans(props.data)
  props.regl = createRegl(props.canvas)
  return creategraph(props)
}

export default { init }

export { createRegl, createTextureFromUrl }
