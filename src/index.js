import KDBush from 'kdbush'
import withThrottle from 'lodash-es/throttle'
import withRaf from 'with-raf'
import { mat4, vec4 } from 'gl-matrix'
import _ from 'lodash'

import processData from './processData';
import createCurves from './curves'
import dom2dCamera from './camera';

import circleSprite from './sprites/border.png'
import starSprite from './sprites/lol.jpg'

import * as d3 from 'd3'

let circleImg = new Image(
)

let starImg = new Image()
starImg.src = starSprite;

circleImg.src = circleSprite;



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
  uniform sampler2D texture;
  uniform sampler2D texture2;


  varying vec4 vColor;
  varying vec3 borderColor;
  varying float uv;
  uniform vec2 resolution;
uniform float time;

  float aastep(float threshold, float value) {
    #ifdef GL_OES_standard_derivatives
      float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
      return smoothstep(threshold-afwidth, threshold+afwidth, value);
    #else
      return step(threshold, value);
    #endif
  }

  void main() {


    // vec2 uv = vec2(gl_FragCoord.xy / resolution.xy) - 0.5;
    //
    // //correct aspect
    // uv.x *= resolution.x / resolution.y;
    //
    // //animate zoom
    // uv /= 1. ;//;sin(time * .2);
    //
    // //radial distance
    // float len = length(uv);
    //
    // //anti-alias
    // len = aastep(0.5, len);
    //
    // gl_FragColor.rgb = vec3(len) + .50;
    // gl_FragColor.a   = 1.0;


    // //
    // if (uv == 0.)
    // gl_FragColor = vColor;
    // else
    // gl_FragColor = texture2D(texture2, gl_PointCoord) * vColor;

    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
      delta = fwidth( r);
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif

      //vec3 color = vColor.rgb;
    //vec3 color =   (delta > 0.75) ? vColor.rgb : borderColor;
    gl_FragColor = texture2D(texture, gl_PointCoord) * vColor;
    //gl_FragColor.a = alpha;

    float vSize = 1.0;
    float uEdgeSize = 2.;
    float distance = length(2.0 * gl_PointCoord - 1.0);


    float sEdge = smoothstep(
        vSize - uEdgeSize - 2.0,
        vSize - uEdgeSize,
        distance * (vSize + uEdgeSize)
    );
    gl_FragColor = vColor;
    //distance = aastep(.5, distance);
    if (distance > .8) gl_FragColor.rgb = vec3(0.);

    if (distance > 1.0) {
        discard;
    }
    //gl_FragColor.rgb = (vec3(.3) * sEdge) + ((1.0 - sEdge) * gl_FragColor.rgb);
    //gl_FragColor.a = .7;
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

  attribute vec4 pos;
  attribute vec3 color;
  //cluster, visiblity, texture
  attribute vec3 stateIndex;
  attribute float dates;
  attribute float sentiment;
  attribute vec2 offset;

  uniform float hoveredPoint;
  uniform float selectedPoint;
  uniform vec2 dimensions;

  uniform float selectedCluster;

  uniform bool flatSize;

  // variables to send to the fragment shader
  varying vec4 vColor;
  varying vec3 borderColor;
  varying float uv;





  void main() {
    vec2 position = pos.xy;
    uv = stateIndex.z < 0. ? 100. : 0.;

    gl_Position = projection * view * vec4(position.xy, 0.0, 1.);

    vColor = vec4(color, 1);

    float finalScaling = pow(sizeAttenuation * 10., scaling);

    finalScaling = 10.;

    if (flatSize) finalScaling = 4. + pow(pointSize, sizeAttenuation);

    if ( (stateIndex[1] == -10.)) vColor.a = .5;

    finalScaling += pow(pos.z, 1.5);

    if (pos.w == hoveredPoint) vColor.xyz -= .2;
    if (pos.w == selectedPoint) vColor.xyz -= .3;

    vColor.a = .7;
    if (pos.w == selectedPoint) vColor.a = 1.;

    gl_PointSize = min(finalScaling, 20.);

    if (stateIndex.y == 0.) gl_Position = vec4(100.);
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

  canvas = options.canvas,
  initialShowRecticle = DEFAULT_SHOW_RECTICLE,
  initialRecticleColor = DEFAULT_RECTICLE_COLOR,
  initialPointSize = DEFAULT_POINT_SIZE,
  initialPointSizeSelected = DEFAULT_POINT_SIZE_SELECTED,
  initialPointOutlineWidth = 2,
  initialWidth = options.width || DEFAULT_WIDTH,
  initialHeight = options.Height || DEFAULT_HEIGHT,
  initialTarget = DEFAULT_TARGET,
  initialDistance = DEFAULT_DISTANCE,
  initialRotation = DEFAULT_ROTATION,
  initialView = DEFAULT_VIEW,
  drawNodes = options.createDrawNodes || NOOP,
  onHover = options.onHover || NOOP,
  onClick = options.onClick || NOOP,

  attributes = options.attributes;
  let size = [initialWidth, initialHeight]


  const scratch = new Float32Array(16);
  let mousePosition  = [0, 0];
  let pointList = []

  let schema = {}

  schema.attributes = {
        pos: {
          //xy size
          buffer: () => attributes.position,
          size: 4
        },
        color: {
          buffer: () => attributes.color,
          size: 3

        },
        stateIndex: {
          //cluster,
          buffer: () => attributes.stateIndex,
          size: 3
        },
        dates: {
          buffer: () => attributes.dates,
          size: 1
        },
        sentiment: {
          buffer: () => attributes.sentiment,
          size: 1
        },
        offset: {buffer: [
          [-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1],


    ], normalized: true},

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
    camera: {view: () => {}},
    projection:  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    model: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    hoveredPoint: -1,
    containerDimensions: options.containerDimensions || (canvas).getBoundingClientRect(),
    size: size
  };
  window.state = state
  window.projection = state.projection

  const getPointSize = () => pointSize * window.devicePixelRatio
  const getNormalPointSizeExtra = () => 0

  const getView = () => {
    return state.camera.view}

  const getPositionBuffer = () => {
    return attributes.position
  }
  const getModel = () => { return state.model }
  const getScaling = () => state.scaling
  const getNormalNumPoints = () => numPoints

  _.extend(state, options.initialState)

  let width = initialWidth
  let height = initialHeight
  const pointSize = initialPointSize
  const pointSizeSelected = initialPointSizeSelected
  const pointOutlineWidth = initialPointOutlineWidth
  let regl = initialRegl || createRegl(canvas)
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

  let isMouseInCanvas = false

  const initCamera = () => {
    state.camera = dom2dCamera(canvas)
    if (initialView) state.camera.setView(mat4.clone(initialView))
    else state.camera.lookAt([...initialTarget], initialDistance, initialRotation)
  }
  initCamera()
  let [updateCurves, drawCurves] = createCurves(options.regl, attributes)

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice()
  const getNdcX = x => -1 + (x / width) * 2
  const getNdcY = y => 1 + (y / height) * -2

  // Get relative WebGL position
  const getMouseGlPos = () => [
    getNdcX(mousePosition[0]),
    getNdcY(mousePosition[1])
  ]

  const getScatterGlPos = (pos=getMouseGlPos()) => {
    const [xGl, yGl] = pos


    // Homogeneous vector
    const v = [xGl, yGl, 1, 1]

    // projection^-1 * view^-1 * model^-1 is the same as
    // model * view^-1 * projection
    let mvp = mat4.invert(
      scratch,
      mat4.multiply(
        scratch,
          state.projection,
        mat4.multiply(scratch, state.camera.view, state.model)
      )
    )

    // Translate vector
    if (! mvp) mvp = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] ;
    vec4.transformMat4(v, v, mvp)

    return v.slice(0, 2)
  }

  const raycast = () => {
    let pointSize = 1000; //scale to zoom level
    const [mouseX, mouseY] = getScatterGlPos()
    const scaling = 1 || state.camera.scaling

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
      if (d < minDist && attributes.stateIndex[1] !== 0) {
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


  const select = (points) => {
    if (typeof points === 'number') selection = [points]
    else selection = points
    drawRaf() // eslint-disable-line no-use-before-define
  }

  let getRelativePosition = (pos) => {
    const rect = canvas.getBoundingClientRect()

    pos[0] = (pos[0] - rect.left ) /// devicePixelRatio
    pos[1] = (pos[1] - rect.top)  /// devicePixelRatio
    return [...pos]
  }

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect()

    mousePosition[0] = (event.clientX - rect.left )// / devicePixelRatio
    mousePosition[1] = (event.clientY - rect.top)  /// devicePixelRatio

    return [...mousePosition]
  }

  const mouseDownHandler = event => {
    if (!isInit) return
    events['mousedown']()
    mouseDown = true

    mouseDownPosition = getRelativeMousePosition(event)
    mouseDownShift = event.shiftKey

    // fix camera
    //if (mouseDownShift) camera.config({ isFixed: true })
  }

  const mouseUpHandler = () => {
    if (!isInit) return
    events['mouseup']()

    mouseDown = false
  }

  const mouseClickHandler = event => {
    if (!isInit) return
    events['click']()

    const currentMousePosition = getRelativeMousePosition(event)
    const clickDist = dist(...currentMousePosition, ...mouseDownPosition)
    const clostestPoint = raycast()
    if (clostestPoint >= 0) select([clostestPoint])
    if (clostestPoint >= 0) onClick(pointList[clostestPoint], clostestPoint, event)

    if (event.shiftKey) {
      updateCurves(pointList)
    }else
    clostestPoint && updateCurves(pointList[clostestPoint], clostestPoint)

  }


  const blurHandler = () => {
    if (!isInit) return;
    events['blur']()
    state.hoveredPoint = -1;
    isMouseInCanvas = false;
    mouseUpHandler();
    drawRaf(); // eslint-disable-line no-use-before-define
  };

  const mouseMoveHandler = event => {
    if (!isInit) return
    events['mousemove']()

    let coordinates = getRelativeMousePosition(event)
    // Only ray cast if the mouse cursor is inside
    if (!mouseDownShift) {
      const clostestPoint = raycast()
      hover(clostestPoint)
      if (clostestPoint)
      events.hover(clostestPoint, pointList[clostestPoint], event, coordinates) // eslint-disable-line no-use-before-define
      else
      events.hoverOff()
    }
    // Always redraw when mouse as the user might have panned
    if (mouseDown) drawRaf() // eslint-disable-line no-use-before-define
  }

  const updateViewAspectRatio = () => {
    viewAspectRatio = width / height
    state.projection = mat4.fromScaling([], [1 / viewAspectRatio, 1, 1])
    state.model = mat4.fromScaling([], [dataAspectRatio, 1, 1])
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

  var emptyTexture = regl.texture({
    shape: [16, 16]
  })


  let textures = [emptyTexture, emptyTexture]

  circleImg.onload = () => {
    textures[0] = regl.texture({premultiplyAlpha: true, data: circleImg})
  }
  if (circleImg.complete) circleImg.onload()

  starImg.onload = () => {
    textures[1] = regl.texture(starImg)
  }
  if (starImg.complete) starImg.onload()

    const drawPointBodies = regl({
      frag: POINT_FS,
      vert: POINT_VS,
      depth: {
   enable: false,

 },

 blend: {
   enable: true,
   func: {
     srcRGB: 'src alpha',
     srcAlpha: 1,
     dstRGB: 'one minus src alpha',
     dstAlpha: 1
   },
   equation: {
     rgb: 'add',
     alpha: 'add'
   },
   color: [0, 0, 0, 0]
 },

      attributes: schema.attributes,

      uniforms: {
        time: (context) => { return console.log(context.time) || context.time },
        resolution: [innerWidth, innerHeight],
        hoveredPoint: () => state.hoveredPoint,
        selectedPoint: () => selection[0] || -1,
        dimensions: [window.innerWidth, window.innerHeight],
        projection:  regl.prop('projection'),
        model: regl.prop('model'),
        view: () => state.camera.view,
        scaling: regl.prop('scaling'),
        pointSize: getPointSize,
        pointSizeExtra: () => 1,
        sizeAttenuation: regl.prop('sizeAttenuation'),
        flatSize: regl.prop('flatSize'),
        texture: () => textures[0],
        texture2: () => textures[1]
      },
      count: getNormalNumPoints,
      primitive: 'points'
    })


  const setPoints = newPoints => {
    isInit = false
    pointList = newPoints
    numPoints = newPoints.length
    searchIndex = new KDBush(newPoints, p => p.x, p => p.y, 16)

    isInit = true
  }

  const draw = () => {
    if (!isInit) return

    //regl.clear({
      //color: [1,1,1,1],
      // color: BG_COLOR,
      //depth: 1
    //})


    // Update camera
    isViewChanged = state.camera.tick()

    //if (state.showLines) drawLines(state)
    //drawEdges(state)
    //drawRecticle(state);

    //if (state.showNodes)
    //
    drawCurves(state)

    drawPointBodies(state);
    state.screenshot = canvas.toDataURL("image/png", 1);

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
    state.camera.refresh()
  }

  const setSize = (width, height) => {
    let dpi = window.devicePixelRatio

    canvas.width =  dpi * width
    canvas.height = dpi *  height

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

     console.log(width,height)
    setHeight(height)
    setWidth(width)

    updateViewAspectRatio()
    state.camera.refresh()
    refresh()
    drawRaf()
  }

  const hover = (point) => {
    let needsRedraw = false


    if (point >= 0) {
      needsRedraw = true
      const newHoveredPoint = point !== state.hoveredPoint
      state.hoveredPoint = point

    } else {
      needsRedraw = state.hoveredPoint
      state.hoveredPoint = -1

      //if (+needsRedraw >= 0) options.deselect()
    }
    //console.log(state.hoveredPoint)
    drawRaf()
    //if (needsRedraw) drawRaf(console.log(null))
  }

  const reset = () => {
    if (initialView) state.camera.set(mat4.clone(initialView))
    else state.camera.lookAt([...initialTarget], initialDistance, initialRotation)
  }

  const mouseEnterCanvasHandler = () => {
    events['mouseenter']()
    isMouseInCanvas = true
  }

  const mouseLeaveCanvasHandler = () => {
    events['mouseleave']()
    hover()
    isMouseInCanvas = false
    drawRaf()
  }
  let wheelDelta= 0;
  const wheelHandler = (e) => {
    console.log(e)
    events['wheel'](wheelDelta += e.wheelDelta)
    drawRaf();
    refresh()
  };



  const init = () => {
    updateViewAspectRatio()

    // Set dimensions
    setSize( width, height )

    window.addEventListener('blur', blurHandler, false);
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
    state.camera = undefined
    regl = undefined
  }

  init(canvas)

  const setState = (options) => {
    drawRaf()
    _.each(options, (k,v) => { state[v] = k })


    if (options.color) {
      let val = options.color
      attributes.color = attributes.colorTypes[val] || attributes.colorTypes['merge']
      //onsole.log(options.color, attributes.colorTypes)
    }

    if (options.showCluster) {
      let showing = options.showCluster
      attributes.stateIndex.forEach(pair => {
        pair[1] = parseInt(options.showCluster[pair[0]] ? 1 : 0)
      })

    }
    if (options.sourceFilter) {
      attributes.stateIndex.forEach((pair, idx) => {
        let show = attributes.nodes[idx].source === options.sourceFilter ? 1 : 0
        pair[1] = options.sourceFilter == 'all' ? 1 : show
      })
    }

  }

  let parseColor = (rgb) => {
    let c = d3.rgb(rgb)
    return [c.r /255 , c.g /255 , c.b /255];
  }

  let eachNode = (indices, property, fn) => {
    let list = Array.isArray(indices) ? indices: attributes.nodes.map((d,i) => i)

    list.forEach(idx => {
      fn(attributes[property][idx], attributes.nodes[idx])
    })
    drawRaf()
  }

  let setNodeColor = (indices, color) => {
    let list = Array.isArray(indices) ? indices: attributes.nodes.map((d,i) => i)

    list.forEach(idx => {

      attributes.color[idx] = parseColor(color)
    })
    drawRaf()
  }

  let setNodeVisibility = (indices, val) => {
    let list = Array.isArray(indices) ? indices: attributes.nodes.map((d,i) => i)
    list.forEach(idx => {
      let show = 'function' == typeof val ? val(attributes.nodes[idx]) : val
      attributes.stateIndex[idx][1] = show
    })
    //console.log(attributes.stateIndex)

    drawRaf()

  }

  let setNodeSize = (indices, size) => {
    indices.forEach(idx => {
      attributes.position[idx][2] = size
    })

    drawRaf()

  }

  let setNodeShape = (indices, shape) => {
    indices.forEach(idx => {
      attributes.stateIndex[idx][2] = - shape
    })

    drawRaf()

  }

  let noop = () => {}
  let events = {
    'blur' :noop,
    'mousedown' :noop,
    'mouseup' :noop,
    'mousemove' :noop,
    'mouseenter' :noop,
    'mouseleave' :noop,
    'hoverOff': noop,
    'click' :noop,
    'wheel': noop,
    hover: noop,
  }

  let on = (event, listener) => {
    events[event] = listener

  }



  return {
    state: state,
    eachNode: eachNode,
    brush: (selection, svg) => {
      let clipspace = function (pos) {
        return [(2. * (pos[0] / width) - 1.,
        1. - ((pos[1] / height) * 2.))]
      }
      // getNdcX(mousePosition[0]),
      // getNdcY(mousePosition[1])
      // debugger
      // function svgPoint(element, x, y) {
      //   var pt = svg.createSVGPoint();
      //
      //   pt.x = x;
      //   pt.y = y;
      //
      //   return pt.matrixTransform(element.getScreenCTM().inverse());
      // }
      //getRelativePosition

       // let clipspace = (pos) => {
       //   let x = svgPoint(svg, pos[0], pos[1])
       //   //console.log(x);
       //   if (Math.random() > .9) console.log(x)
       //
       //   pos[0] =  2. * (x.x / containerDimensions.width) - 1.;
       //   pos[1] = 1. - (x.y / containerDimensions.height) * 2.;
       // }

       let p = selection.map(clipspace).map(getScatterGlPos)
       //console.log(clipspace)
      let [[x0, y0], [x1,  y1]] = selection;
      //console.log(attributes)
      attributes.stateIndex.forEach((trip, i) => {
        let [x, y] = attributes.position[i].slice(0, 2)
        //if (Math.random() > .9) console.log(x0, x, x1, y0, y, y1)

       //console.log(x0, x, x1, y0, y, y1)
        trip[1] = x0 <= x && x <= x1
            && y0 <= y && y <= y1
            ? 10 : -10;
            //console.log(trip[1])
      })
      draw()


    },

    resetView: () => {
      state.camera.setView(mat4.clone(initialView))
      draw()


    },
    zoomToNode: (id) => {
      let pos = attributes.position[id]
      let xy = pos.slice(0,2)
      camera.lookAt(xy)
      draw()
      //camera.setView(mat4.clone(initialView))
    },



    setSize,
    setNodeColor,
    setNodeSize,
    setNodeShape,
    setNodeVisibility,

    deselect,
    destroy,
    on: on,

    draw: drawRaf,
    repaint: () => {
      withDraw(reset)();
    },
    hoverPoint: (uuid) => {
      state.hoveredPoint = pointList.findIndex(d => d.uuid === uuid)
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
