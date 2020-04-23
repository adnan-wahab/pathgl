import KDBush from 'kdbush'
import withThrottle from 'lodash-es/throttle'
import withRaf from 'with-raf'
import { mat4, vec4 } from 'gl-matrix'
import _ from 'lodash'

import processData from './processData';
import createLine from './lines'
import createCurves from './curves'
import createDom2dCamera from './2d-camera';

import createDrawLines from './edges'



import {
  COLOR_ACTIVE_IDX,
  COLOR_BG_IDX,
  COLOR_HOVER_IDX,
  COLOR_NORMAL_IDX,
  COLOR_NUM_STATES,
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

const BG_COLOR = [    0.1411764705882353,
  0.15294117647058825,
  0.18823529411764706, 1]

  const POINT_FS = `
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif
  precision mediump float;

  uniform vec2 selection;

  varying vec4 vColor;
  varying vec3 borderColor;

  void main() {

    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
      delta = fwidth(r);
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif

    vec3 color =   (r < 0.75) ? vColor.rgb : borderColor;
    if (r > .95) discard;
    gl_FragColor = vec4(color, alpha * vColor.a);
  }
  `
  const POINT_VS = `
  precision mediump float;
  uniform float pointSize;
  uniform float pointSizeExtra;
  uniform float numNodes;
  uniform float scaling;
  uniform float sizeAttenuation;
  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;

  uniform vec2 dateFilter;

  attribute vec4 pos;
  attribute vec3 color;
  attribute vec2 stateIndex;
  attribute float dates;
  attribute float sentiment;


  uniform float hoveredPoint;
  uniform float selectedPoint;
  uniform int sentimentFilter;
  uniform vec2 dimensions;




  uniform float selectedCluster;

  uniform bool flatSize;

  // variables to send to the fragment shader
  varying vec4 vColor;
  varying vec3 borderColor;

  void main() {
    vec2 position = pos.xy;
    // position.x = position.x / dimensions.x;
    // position.y = position.y / dimensions.y;



    if (! (dates > dateFilter.x && dates < dateFilter.y)) return;

    gl_Position = projection * view * vec4(position.xy, 0.0, 1.);

    vColor = vec4(color, 1.);


    //if (selectedCluster > -.1 && selectedCluster != stateIndex.x) finalScaling = 0.;

    float finalScaling = pow(sizeAttenuation, scaling);

    finalScaling = 10.;

    if (pos.w == hoveredPoint) finalScaling = 20.;
    if (pos.w == hoveredPoint) borderColor = vec3(1);
    else borderColor = vec3(0.1411764705882353, 0.15294117647058825, 0.18823529411764706);

    if (pos.w == selectedPoint) finalScaling = 30.;
    if (pos.w == selectedPoint) vColor = vec4(1);

    if (pos.w == hoveredPoint) gl_Position.z -= .1;
    if (pos.w == selectedPoint) gl_Position.z -= .2;

    finalScaling += pos.z;




    if (flatSize) finalScaling = 4. + pow(pointSize, sizeAttenuation);
        if (sentimentFilter == 1) { //only show positive
          if (sentiment < .25) finalScaling = 0.;
        }
        if (sentimentFilter == 2) {  //only show negative
          if (sentiment > -.25) finalScaling = 0.;
        }
        if (sentimentFilter == 3) { //only show neutral
          if (! (sentiment < .25 && sentiment > -.25))  finalScaling = 0.;
        }

  if (! (stateIndex[1] == 1.)) finalScaling = 0.;

    gl_PointSize = finalScaling + pointSizeExtra;

  }
  `


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




const NOOP = () => {}

const creategraph = (options) => {
  let initialRegl = options.regl,

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
  drawNodes = options.createDrawNodes || NOOP,
  onHover = options.onHover || NOOP,
  onClick = options.onClick || NOOP,
  attributes = options.attributes;
  const scratch = new Float32Array(16);
  let mousePosition  = [0, 0];
  let pointList = []

  let schema = {}

  schema.attributes = {
        pos: {
          buffer: () => attributes.position,
          size: 4
        },
        color: {
          buffer: () => attributes.color,
          size: 3

        },
        stateIndex: {
          buffer: () => attributes.stateIndex,
          size: 2
        },
        dates: {
          buffer: () => attributes.dates,
          size: 1
        },
        sentiment: {
          buffer: () => attributes.sentiment,
          size: 1
        },

      }


  //props schema - make external
  let state = {
    sizeAttenuation: .1,
    sentimentFilter: 0,
    scaling: .4,
    numNodes: 1,
    showLines: true,
    showNodes: true,
    flatSize: true,
    edgeColors: true,
    selectedCluster: -1,
    favorites: [],
    dateFilter: [0,Infinity],
    camera:null,
    projection:  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    model: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  };

  const getPointSize = () => pointSize * window.devicePixelRatio
  const getNormalPointSizeExtra = () => 0
  let getProjection = () => { return state.projection }

  const getView = () => {
    return camera.view}

  const getPositionBuffer = () => {
    return attributes.position
  }
  const getModel = () => { return state.model }
  const getScaling = () => state.scaling
  const getNormalNumPoints = () => numPoints


  _.extend(state, options.initialState)



  checkReglExtensions(initialRegl)

  let canvas = initialCanvas
  let width = initialWidth
  let height = initialHeight
  const pointSize = initialPointSize
  const pointSizeSelected = initialPointSizeSelected
  const pointOutlineWidth = initialPointOutlineWidth
  let regl = initialRegl || createRegl(initialCanvas, {premultipliedAlpha: false})
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
  const showRecticle = initialShowRecticle
  let recticleHLine
  let recticleVLine
  const recticleColor = toRgba(initialRecticleColor, true)

  let isViewChanged = false
  let isInit = false

  const opacity = 1

  let hoveredPoint = -1
  let isMouseInCanvas = false

  const initCamera = () => {
    camera = createDom2dCamera(canvas)
    if (initialView) camera.set(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
  }
  initCamera()

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
    let mvp = mat4.invert(
      scratch,
      mat4.multiply(
        scratch,
          state.projection,
        mat4.multiply(scratch, camera.view, state.model)
      )
    )

    // Translate vector
    if (! mvp) mvp = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] ;
    vec4.transformMat4(v, v, mvp)

    return v.slice(0, 2)
  }

  let drawLines = createDrawLines(options.regl, attributes, getModel, getProjection, getView)

  let [updateCurves, drawCurves] = createCurves(options.regl, attributes, getModel, getProjection, getView)
  console.log(updateCurves, drawCurves)
    //
  const raycast = () => {
    let pointSize = 100; //MAD HACKS
    const [mouseX, mouseY] = getScatterGlPos()
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
      mouseX - xNormalizedScaledPointSize,
      mouseY - yNormalizedScaledPointSize,
      mouseX + xNormalizedScaledPointSize,
      mouseY + yNormalizedScaledPointSize
    )
    // Find the closest point
    let minDist = scaledPointSize
    let clostestPoint

    pointsInBBox.forEach(idx => {
      const {x, y} = searchIndex.points[idx]
      const d = dist(x, y, mouseX, mouseY)
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
  const selectCluster = (n) => {
    if (state.selectedCluster === n) state.selectedCluster = -n
    else state.selectedCluster = n
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
    //if (mouseDownShift) camera.config({ isFixed: true })
  }

  const mouseUpHandler = () => {
    if (!isInit) return

    mouseDown = false
  }

  const mouseClickHandler = event => {
    if (!isInit) return

    const currentMousePosition = getRelativeMousePosition(event)
    const clickDist = dist(...currentMousePosition, ...mouseDownPosition)
    const clostestPoint = raycast()
    if (clostestPoint >= 0) select([clostestPoint])
    if (clostestPoint >= 0) onClick(pointList[clostestPoint], clostestPoint, event)

    if (event.shiftKey) {
      console.log('logl')
      updateCurves(pointList[clostestPoint], clostestPoint)
  }
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
    state.projection = mat4.fromScaling([], [1 / viewAspectRatio, 1, 1])
    state.model = mat4.fromScaling([], [dataAspectRatio, 1, 1])
    //console.log('updating model', model)
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




  const drawAllPoints = (
    getPointSizeExtra,
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



      attributes: schema.attributes,

      uniforms: {
        hoveredPoint: () => hoveredPoint,
        selectedPoint: () => selection[0] || -1,
        dimensions: [window.innerWidth, window.innerHeight],
        projection: getProjection,
        //time: (ctx) => {return ctx.time },
        dateFilter: regl.prop('dateFilter'),
        selectedCluster: () => (attributes.position.length < 1 ? state.selectedCluster : -100 ),
        model: getModel,
        view: getView,
        scaling: getScaling,
        pointSize: getPointSize,
        pointSizeExtra: getPointSizeExtra,
        sizeAttenuation: regl.prop('sizeAttenuation'),
        flatSize: regl.prop('flatSize'),
        sentimentFilter: regl.prop('sentimentFilter')
      },
      count: getNormalNumPoints,
      primitive: 'points'
    })



  const drawPointBodies = drawAllPoints(
    getNormalPointSizeExtra,
    getNormalNumPoints
    )

  window.tooltip = (x, y) => {

    let v = [x, y, 0, 1]
    mat4.multiply(
      scratch,
        state.projection,
      mat4.multiply(scratch, camera.view, state.model)
    )

    vec4.transformMat4(v, v, scratch)
  }

  const drawRecticle = (state) => {
    if (!(hoveredPoint >= 0)) return

    const {x, y} = searchIndex.points[hoveredPoint]
    // Normalized device coordinate of the point
    const v = [x, y, 0, 1]

    // We have to calculate the model-view-projection matrix outside of the
    // shader as we actually don't want the mode, view, or projection of the
    // line view space to change such that the recticle is visualized across the
    // entire view container and not within the view of the graph
    mat4.multiply(
      scratch,
        state.projection,
      mat4.multiply(scratch, camera.view, state.model)
    )

    vec4.transformMat4(v, v, scratch)

    recticleHLine.setPoints([-1, v[1], 1, v[1]])
    recticleVLine.setPoints([v[0], 1, v[0], -1])

    recticleHLine.draw()
    recticleVLine.draw()

  }

  const setPoints = newPoints => {
    isInit = false
    pointList = newPoints
    numPoints = newPoints.length
    searchIndex = new KDBush(newPoints, p => p.x, p => p.y, 16)

    isInit = true
  }

  const draw = () => {
    if (!isInit) return

    regl.clear({
      color: BG_COLOR,
      depth: 1
    })

    // Update camera
    isViewChanged = camera.tick()

    //if (state.showLines) drawLines(state)
    //drawEdges(state)
    drawRecticle(state);

    if (state.showNodes) drawPointBodies(state);
    drawCurves()
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
      //ADNAN MODE
      //if (+needsRedraw >= 0) options.deselect()
    }

    if (needsRedraw) drawRaf(null)
  }

  const reset = () => {
    if (initialView) camera.set(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
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
    refresh()
  };



  const init = () => {
    updateViewAspectRatio()

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

    window.addEventListener('mousedown', mouseDownHandler, false)
    window.addEventListener('mouseup', mouseUpHandler, false)
    window.addEventListener('mousemove', mouseMoveHandler, false)
    canvas.addEventListener('mouseenter', mouseEnterCanvasHandler, false)
    canvas.addEventListener('mouseleave', mouseLeaveCanvasHandler, false)
    canvas.addEventListener('click', mouseClickHandler, false)
    canvas.addEventListener('wheel', wheelHandler);
    setPoints(attributes.nodes) //create Index
  }

  const destroy = () => {
    canvas = undefined
    camera = undefined
    regl = undefined
  }

  init(canvas)

  const setState = (options) => {
    drawRaf()
    _.each(options, (k,v) => { state[v] = k })


    if (options.color) {
      let val = options.color
      attributes.color = attributes.colorTypes[val] || attributes.colorTypes['merge']
      console.log(options.color, attributes.colorTypes)
    }

    if (options.showCluster) {
      let showing = options.showCluster
      attributes.stateIndex.forEach(pair => {
        console.log(pair[0])
        pair[1] = parseInt(options.showCluster[pair[0]] ? 1 : 0)
      })
      console.log(attributes.stateIndex)

    }
  }




  return {
    deselect,
    destroy,

    draw: drawRaf,
    repaint: () => {
      withDraw(reset)();
    },
    hoverPoint: (uuid) => {
      hoveredPoint = pointList.findIndex(d => d.uuid === uuid)
      draw()
    },
    refresh,
    reset: withDraw(reset),
    select,
    setState,
    getView,
  }
}


const init = (props) => {
  props.attributes = processData(props.data)
  props.regl = createRegl(props.canvas)
  let graph = creategraph(props)
  graph._data = props
  return graph
}

export default { init }

export { createRegl, createTextureFromUrl }
