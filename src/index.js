import KDBush from 'kdbush'
import withThrottle from 'lodash-es/throttle'
import withRaf from 'with-raf'
import { mat4, vec4 } from 'gl-matrix'
import _ from 'lodash'

import processData from './processData';
import createLine from './lines'
import createCurves from './curves'
import dom2dCamera from './camera';

import createDrawLines from './edges'
import circleSprite from './sprites/circle-border.png'
import starSprite from './lmaostar.gif'

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

  void main() {


    if (uv == 0.)
    gl_FragColor = texture2D(texture, gl_PointCoord) * vColor;
    else
    gl_FragColor = texture2D(texture2, gl_PointCoord) * vColor;

    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
      delta = fwidth(r);
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif

    vec3 color =   (r < 0.75) ? vColor.rgb : borderColor;
    if (r > .9) discard;

    //if (gl_FragColor.a < .9) gl_FragColor.a = 0.;
    gl_FragColor.a = .9;
    //if (r > .75) gl_FragColor.a = alpha;
    //if (r > .75) gl_FragColor = vec4(1, 1,1,alpha);
    if (r > .75) gl_FragColor = vec4(0,0,0,alpha);

    //gl_FragColor.a -= r;

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
  uniform int sentimentFilter;

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
    // position.x = position.x / dimensions.x;
    // position.y = position.y / dimensions.y;
    uv = stateIndex.z < 0. ? 100. : 0.;


    if (! (dates > dateFilter.x && dates < dateFilter.y)) return;

    gl_Position = projection * view * vec4(position.xy, 0.0, 1.);


    vColor = vec4(color, 1);

    float finalScaling = pow(sizeAttenuation * 10., scaling);

    finalScaling = 10.;



    if (flatSize) finalScaling = 4. + pow(pointSize, sizeAttenuation);


        //if (pos.w == hoveredPoint) finalScaling += 20.;
        //if (pos.w == hoveredPoint) borderColor = vec3(0);
      //else borderColor = vec3(0.1411764705882353, 0.15294117647058825, 0.18823529411764706);

            if (sentimentFilter == 1) { //only show positive
              if (sentiment < .25) finalScaling = 0.;
            }
            if (sentimentFilter == 2) {  //only show negative
              if (sentiment > -.25) finalScaling = 0.;
            }
            if (sentimentFilter == 3) { //only show neutral
              if (! (sentiment < .25 && sentiment > -.25))  finalScaling = 0.;
            }

  //if (! (stateIndex[1] == 1.)) finalScaling = 0.;
    if ( (stateIndex[1] == -10.)) vColor.a = .5;

    finalScaling += pow(pos.z, 1.5);

    //if (pos.w == hoveredPoint) gl_Position.z -= .5;
    //if (pos.w == selectedPoint) gl_Position.z -= .4;

    if (pos.w == hoveredPoint) vColor.xyz -= .2;
    if (pos.w == selectedPoint) vColor.xyz -= .3;

    //if (pos.w == selectedPoint) borderColor = vec3(0);


    //gl_Position.z = pos.z / 100.;
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


  let containerDimensions = options.containerDimensions || (initialCanvas).getBoundingClientRect()

  initialCanvas.width = containerDimensions.width
  initialCanvas.height = containerDimensions.height

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
    camera:null,
    projection:  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    model: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    hoveredPoint: -1
  };
  window.state = state
  window.projection = state.projection

  const getPointSize = () => pointSize * window.devicePixelRatio
  const getNormalPointSizeExtra = () => 0
  let getProjection = () => {
    console.log(state.projection)
    return state.projection }

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
  const showRecticle = initialShowRecticle
  let recticleHLine
  let recticleVLine
  const recticleColor = toRgba(initialRecticleColor, true)

  let isViewChanged = false
  let isInit = false

  const opacity = 1

  let isMouseInCanvas = false

  const initCamera = () => {
    camera = dom2dCamera(canvas)
    if (initialView) camera.setView(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
  }
  initCamera()
  let [updateCurves, drawCurves] = createCurves(options.regl, attributes, getModel, getProjection, getView)

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
        mat4.multiply(scratch, camera.view, state.model)
      )
    )

    // Translate vector
    if (! mvp) mvp = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] ;
    vec4.transformMat4(v, v, mvp)

    return v.slice(0, 2)
  }

  let drawLines = createDrawLines(options.regl, attributes, getModel, getProjection, getView)


  const raycast = () => {
    let pointSize = 1000; //scale to zoom level
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

    pos[0] = (pos[0] - rect.left ) / devicePixelRatio
    pos[1] = (pos[1] - rect.top)  / devicePixelRatio
    return [...pos]
  }

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect()

    mousePosition[0] = (event.clientX - rect.left ) / devicePixelRatio
    mousePosition[1] = (event.clientY - rect.top)  / devicePixelRatio

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
      updateCurves(pointList[clostestPoint], clostestPoint)
    }
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



  const drawAllPoints = (
    getPointSizeExtra,
  ) =>
    regl({
      frag: POINT_FS,
      vert: POINT_VS,

      blend: {
        enable: true,
        func: {
          srcRGB:   'src alpha',
        srcAlpha: 'src alpha',
        dstRGB:   'one minus src alpha',
        dstAlpha: 'one minus src alpha'
        },
      },



      attributes: schema.attributes,

      uniforms: {
        hoveredPoint: () => state.hoveredPoint,
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
        sentimentFilter: regl.prop('sentimentFilter'),
        texture: () => textures[0],
        texture2: () => textures[1]
      },
      count: getNormalNumPoints,
      primitive: 'points'
    })



  const drawPointBodies = drawAllPoints(
    getNormalPointSizeExtra,
    getNormalNumPoints
    )

  window.tooltip = (x, y) => {
    //
    // let v = [x, y, 0, 1]
    // mat4.multiply(
    //   scratch,
    //     state.projection,
    //   mat4.multiply(scratch, camera.view, state.model)
    // )
    //
    // vec4.transformMat4(v, v, scratch)
  }

  const drawRecticle = (state) => {
    if (!(state.hoveredPoint >= 0)) return

    const {x, y} = searchIndex.points[state.hoveredPoint]
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

    options.tooltip && options.tooltip()

    //if (! options.drawRecticle) return
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
      color: [1,1,1,1],
      //depth: 1
    })


    // Update camera
    isViewChanged = camera.tick()

    //if (state.showLines) drawLines(state)
    //drawEdges(state)
    drawRecticle(state);

    //if (state.showNodes)
    drawPointBodies(state);
    drawCurves()
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
    camera.refresh()
  }

  const setSize = (width, height) => {
    canvas.width = width;
     canvas.height = height;

    setHeight(height)
    setWidth(width)

    updateViewAspectRatio()
    camera.refresh()
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
    if (initialView) camera.set(mat4.clone(initialView))
    else camera.lookAt([...initialTarget], initialDistance, initialRotation)
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
      camera.setView(mat4.clone(initialView))
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
    camera: camera,
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
