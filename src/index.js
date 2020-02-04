import canvasCamera2d from 'canvas-camera-2d';
import KDBush from 'kdbush';
import createPubSub from 'pub-sub-es';
import withThrottle from 'lodash-es/throttle';
import withRaf from 'with-raf';
import { mat4, vec4 } from 'gl-matrix';
import createScroll from 'scroll-speed';
import _ from 'lodash';
import * as d3 from 'd3'
import createLine from './lines'
import createDrawLines from './edges';
import createDrawNodes from './nodes';

let BG_FS = `
precision mediump float;

uniform sampler2D texture;

varying vec2 uv;

void main () {
  gl_FragColor = texture2D(texture, uv);
}
`;
let BG_VS =  `
precision mediump float;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

attribute vec2 position;

varying vec2 uv;

void main () {
  uv = position;
  gl_Position = projection * view * model * vec4(1.0 - 2.0 * position, 0, 1);
}
`;
;
let POINT_FS = `
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
`;
let POINT_VS = `
precision mediump float;

uniform sampler2D colorTex;
uniform float colorTexRes;
uniform sampler2D stateTex;
uniform float pointSize;
uniform float pointSizeExtra;
uniform float numPoints;
uniform float scaling;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

attribute float stateIndex;
attribute vec2 pos;
attribute vec3 color;

// variables to send to the fragment shader
varying vec4 vColor;

void main() {
  gl_Position = projection * view * model * vec4(pos, 0.0, 1.0);

  vColor = vec4(color, 1);

  // The final scaling consists of linear scaling in [0, 1] and log scaling
  // in [1, [
  float finalScaling = min(1.0, scaling) + log2(max(1.0, scaling));

  gl_PointSize = pointSize * finalScaling + pointSizeExtra;
}
`;

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
  FLOAT_BYTES,
} from './constants';

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
} from './utils';
let NOOP = () => {}

const creategraph = (options) => {
  let state = {scaling: 1, numPoints: 1}
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
  drawLines = options.createDrawLines || NOOP,
  drawNodes = options.createDrawNodes || NOOP,
  onHover = options.onHover || NOOP,
  onClick = options.onClick || NOOP,
  attributes = options.attributes;
  const pubSub = createPubSub();
  const scratch = new Float32Array(16);
  const mousePosition = [0, 0];

  checkReglExtensions(initialRegl);

  let background = toRgba(initialBackground, true);
  let backgroundImage = initialBackgroundImage;
  let canvas = initialCanvas;
  let width = initialWidth;
  let height = initialHeight;
  let pointSize = initialPointSize;
  let pointSizeSelected = initialPointSizeSelected;
  let pointOutlineWidth = initialPointOutlineWidth;
  let regl = initialRegl || createRegl(initialCanvas);
  let camera;
  let scroll;
  let mouseDown = false;
  let mouseDownShift = false;
  let mouseDownPosition = [0, 0];
  let numPoints = 0;
  let selection = [];
  let searchIndex;
  let viewAspectRatio;
  let dataAspectRatio = DEFAULT_DATA_ASPECT_RATIO;
  let projection;
  let model;
  let showRecticle = initialShowRecticle;
  let recticleHLine;
  let recticleVLine;
  let recticleColor = toRgba(initialRecticleColor, true);


  let stateTex; // Stores the point texture holding x, y, category, and value
  let stateTexRes = 0; // Width and height of the texture
  let normalPointsIndexBuffer; // Buffer holding the indices pointing to the correct texel
  let selectedPointsIndexBuffer; // Used for pointing to the selected texels
  let hoveredPointIndexBuffer; // Used for pointing to the hovered texels

  let colorTex; // Stores the color texture
  let colorTexRes = 0; // Width and height of the texture

  let isViewChanged = false;
  let isInit = false;

  let opacity = 1;

  let hoveredPoint;
  let isMouseInCanvas = false;

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice();
  const getNdcX = x => -1 + (x / width) * 2;
  const getNdcY = y => 1 + (y / height) * -2;

  // Get relative WebGL position
  const getMouseGlPos = () => [
    getNdcX(mousePosition[0]),
    getNdcY(mousePosition[1])
  ];

  const getScatterGlPos = () => {
    const [xGl, yGl] = getMouseGlPos();

    // Homogeneous vector
    const v = [xGl, yGl, 1, 1];

    // projection^-1 * view^-1 * model^-1 is the same as
    // model * view^-1 * projection
    const mvp = mat4.invert(
      scratch,
      mat4.multiply(
        scratch,
        projection,
        mat4.multiply(scratch, camera.view, model)
      )
    );

    // Translate vector
    vec4.transformMat4(v, v, mvp);

    return v.slice(0, 2);
  };

  const raycast = () => {
    const [x, y] = getScatterGlPos();
    const scaling = camera.scaling;
    const scaledPointSize =
      2 *
      pointSize *
      (min(1.0, scaling) + Math.log2(max(1.0, scaling))) *
      window.devicePixelRatio;

    const xNormalizedScaledPointSize = scaledPointSize / width;
    const yNormalizedScaledPointSize = scaledPointSize / height;

    // Get all points within a close range
    const pointsInBBox = searchIndex.range(
      x - xNormalizedScaledPointSize,
      y - yNormalizedScaledPointSize,
      x + xNormalizedScaledPointSize,
      y + yNormalizedScaledPointSize
    );

    // Find the closest point
    let minDist = scaledPointSize;
    let clostestPoint;
    pointsInBBox.forEach(idx => {
      const [ptX, ptY] = searchIndex.points[idx];
      const d = dist(ptX, ptY, x, y);
      if (d < minDist) {
        minDist = d;
        clostestPoint = idx;
      }
    });

    if (minDist < (pointSize / width) * 2) {
      onHover(clostestPoint, x, y, 'why')
      return clostestPoint
    };
    return -1;
  };


  const deselect = () => {
    if (selection.length) {
      pubSub.publish('deselect');
      selection = [];
      drawRaf(); // eslint-disable-line no-use-before-define
    }
  };

  const select = points => {
    points.forEach(p => {
      selection.includes(p) ?  _.pull(selection, p) : selection.push(p)
    })

    selectedPointsIndexBuffer({
      usage: 'dynamic',
      type: 'float',
      data: new Float32Array(selection)
    });

    pubSub.publish('select', {
      points: selection
    });

    drawRaf(); // eslint-disable-line no-use-before-define
  };

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect();

    mousePosition[0] = event.clientX - rect.left;
    mousePosition[1] = event.clientY - rect.top;

    return [...mousePosition];
  };

  const mouseDownHandler = event => {
    if (!isInit) return;


    mouseDown = true;

    mouseDownPosition = getRelativeMousePosition(event);
    mouseDownShift = event.shiftKey;

    // fix camera
    if (mouseDownShift) camera.config({ isFixed: true });
  };

  const mouseUpHandler = () => {
    if (!isInit) return;

    mouseDown = false;

    if (mouseDownShift) {
      mouseDownShift = false;
      camera.config({ isFixed: false });
    }
  };

  const mouseClickHandler = event => {
    if (!isInit) return;

    const currentMousePosition = getRelativeMousePosition(event);
    const clickDist = dist(...currentMousePosition, ...mouseDownPosition);
    const clostestPoint = raycast();
    if (clostestPoint >= 0) select([clostestPoint]);
    if (clostestPoint >= 0) onClick(clostestPoint)
  };

  const mouseDblClickHandler = () => {
    deselect();
  };

  const mouseMoveHandler = event => {
    if (!isInit) return;

    getRelativeMousePosition(event);
    // Only ray cast if the mouse cursor is inside
    if (isMouseInCanvas && !mouseDownShift) {
      const clostestPoint = raycast();
      hover(clostestPoint); // eslint-disable-line no-use-before-define
    }
    // Always redraw when mouse as the user might have panned
    if (mouseDown) drawRaf(); // eslint-disable-line no-use-before-define
  };

  const updateViewAspectRatio = () => {
    viewAspectRatio = width / height;
    projection = mat4.fromScaling([], [1 / viewAspectRatio, 1, 1]);
    model = mat4.fromScaling([], [dataAspectRatio, 1, 1]);
  };

  const setHeight = newHeight => {
    if (!+newHeight || +newHeight <= 0) return;
    height = +newHeight;
    canvas.height = height * window.devicePixelRatio;
  };

  const setWidth = newWidth => {
    if (!+newWidth || +newWidth <= 0) return;
    width = +newWidth;
    canvas.width = width * window.devicePixelRatio;
  };

  const getBackgroundImage = () => backgroundImage;
  const getColorTex = () => colorTex;
  const getColorTexRes = () => colorTexRes;
  const getNormalPointsIndexBuffer = () => normalPointsIndexBuffer;
  const getSelectedPointsIndexBuffer = () => selectedPointsIndexBuffer;
  const getPointSize = () => pointSize * window.devicePixelRatio;
  const getNormalPointSizeExtra = () => 0;
  const getStateTex = () => stateTex;
  const getStateTexRes = () => stateTexRes;
  const getProjection = () => projection;
  window.getView = () => camera.view;
  const getPositionBuffer = () => {
    return attributes.position
  }
  const getModel = () => model;
  const getScaling = () => state.scaling;
  const getNormalNumPoints = () => numPoints * state.numPoints | 0;
  window.getNormalNumPoints = getNormalNumPoints
  window.getScaling = getScaling
  const getMaxColor = () => colors.length / COLOR_NUM_STATES - 1;
  const getNumColorStates = () => COLOR_NUM_STATES;

  const drawPoints = (
    getPointSizeExtra,
    getNumPoints,
    getStateIndexBuffer
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
        stateIndex: {
          buffer: getStateIndexBuffer,
          size: 1
        },
        pos: {
          buffer: getPositionBuffer,
          size: 2
        },
        color: {
          buffer: attributes.color,
          size:3
        }
      },

      uniforms: {
        projection: getProjection,
        model: getModel,
        view: getView,
        scaling: getScaling,
        pointSize: getPointSize,
        pointSizeExtra: getPointSizeExtra
      },

      count: getNumPoints,

      primitive: 'points'
    });

  const drawPointBodies = drawPoints(
    getNormalPointSizeExtra,
    getNormalNumPoints,
    getNormalPointsIndexBuffer
  );

  const drawHoveredPoint = drawPoints(
    getNormalPointSizeExtra,
    () => 1,
    () => hoveredPointIndexBuffer,
    COLOR_HOVER_IDX
  );

  const drawSelectedPoint = () => {
    const numOutlinedPoints = selection.length;

    // Draw outer outline
    drawPoints(
      () =>
        (pointSizeSelected + pointOutlineWidth * 2) * window.devicePixelRatio,
      () => numOutlinedPoints,
      getSelectedPointsIndexBuffer,
      COLOR_ACTIVE_IDX
    )();

    // Draw inner outline
    drawPoints(
      () => (pointSizeSelected + pointOutlineWidth) * window.devicePixelRatio,
      () => numOutlinedPoints,
      getSelectedPointsIndexBuffer,
      COLOR_BG_IDX
    )();

    // Draw body
    drawPoints(
      () => pointSizeSelected,
      () => numOutlinedPoints,
      getSelectedPointsIndexBuffer,
      COLOR_ACTIVE_IDX
    )();
  };

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
  });

  const drawRecticle = () => {
    if (!(hoveredPoint >= 0)) return;

    const [x, y] = searchIndex.points[hoveredPoint].slice(0, 2);

    // Normalized device coordinate of the point
    const v = [x, y, 0, 1];

    // We have to calculate the model-view-projection matrix outside of the
    // shader as we actually don't want the mode, view, or projection of the
    // line view space to change such that the recticle is visualized across the
    // entire view container and not within the view of the graph
    mat4.multiply(
      scratch,
      projection,
      mat4.multiply(scratch, camera.view, model)
    );

    vec4.transformMat4(v, v, scratch);

    recticleHLine.setPoints([-1, v[1], 1, v[1]]);
    recticleVLine.setPoints([v[0], 1, v[0], -1]);

    recticleHLine.draw();
    recticleVLine.draw();

    // Draw outer outline
    drawPoints(
      () =>
        (pointSizeSelected + pointOutlineWidth * 2) * window.devicePixelRatio,
      () => 1,
      hoveredPointIndexBuffer,
      COLOR_ACTIVE_IDX
    )();

    // Draw inner outline
    drawPoints(
      () => (pointSizeSelected + pointOutlineWidth) * window.devicePixelRatio,
      () => 1,
      hoveredPointIndexBuffer,
      COLOR_BG_IDX
    )();
  };

  const createPointIndex = numNewPoints => {
    const index = new Float32Array(numNewPoints);

    for (let i = 0; i < numNewPoints; ++i) {
      index[i] = i;
    }

    return index;
  };

  const createStateTexture = newPoints => { //fuck this
    const numNewPoints = newPoints.length;
    stateTexRes = Math.max(2, Math.ceil(Math.sqrt(numNewPoints)));
    const data = new Float32Array(stateTexRes ** 2 * 4);

    for (let i = 0; i < numNewPoints; ++i) {
      data[i * 4] = newPoints[i][0]; // x
      data[i * 4 + 1] = newPoints[i][1]; // y
      data[i * 4 + 2] = .1; // category
      data[i * 4 + 3] = .1; // value
    }

    return regl.texture({
      data,
      shape: [stateTexRes, stateTexRes, 4],
      type: 'float'
    });
  };

  const setPoints = newPoints => {
    isInit = false;

    numPoints = newPoints.length;

    normalPointsIndexBuffer({
      usage: 'static',
      type: 'float',
      data: createPointIndex(numPoints)
    });

    searchIndex = new KDBush(newPoints, p => p[0], p => p[1], 16);

    isInit = true;
  };

  const draw = () => {
    if (!isInit) return;

    regl.clear({
      // background color (transparent)
      color: [0, 0, 0, 0],
      depth: 1
    });

    // Update camera
    isViewChanged = camera.tick();

    if (backgroundImage) {
      drawBackgroundImage();
    }
    //drawLines({view: getView(), projection: getView()})
    //drawNodes({view: getView(), projection: getView()})

    // The draw order of the following calls is important!
    drawPointBodies();
    drawRecticle();
    if (hoveredPoint >= 0) drawHoveredPoint();
    if (selection.length) drawSelectedPoint();
    // Publish camera change
    if (isViewChanged) pubSub.publish('view', camera.view);
  };

  const drawRaf = withRaf(draw);

  const withDraw = f => (...args) => {
    const out = f(...args);
    drawRaf();
    return out;
  };


  /**
   * Update Regl's viewport, drawingBufferWidth, and drawingBufferHeight
   *
   * @description Call this method after the viewport has changed, e.g., width
   * or height have been altered
   */
  const refresh = () => {
    regl.poll();
  };

  const set = ({
    height: newHeight = null,
    width: newWidth = null,
  } = {}) => {
    setHeight(newHeight);
    setWidth(newWidth);

    updateViewAspectRatio();
    camera.refresh();
    refresh();
    drawRaf();
  };

  const hover = (point, showRecticleOnce = false) => {
    let needsRedraw = false;

    if (point >= 0) {
      onHover(point)

      needsRedraw = true;
      const newHoveredPoint = point !== hoveredPoint;
      hoveredPoint = point;
      hoveredPointIndexBuffer.subdata([point]);
      if (newHoveredPoint) pubSub.publish('pointover', hoveredPoint);
    } else {
      needsRedraw = hoveredPoint;
      hoveredPoint = undefined;
      if (+needsRedraw >= 0) pubSub.publish('pointout', needsRedraw);
    }

    if (needsRedraw) drawRaf(null, showRecticleOnce);
  };

  const reset = () => {
    if (initialView) camera.set(mat4.clone(initialView));
    else camera.lookAt([...initialTarget], initialDistance, initialRotation);
    pubSub.publish('view', camera.view);
  };

  const mouseEnterCanvasHandler = () => {
    isMouseInCanvas = true;
  };

  const mouseLeaveCanvasHandler = () => {
    hover();
    isMouseInCanvas = false;
    drawRaf();
  };

  const initCamera = () => {
    camera = canvasCamera2d(canvas);

    if (initialView) camera.set(mat4.clone(initialView));
    else camera.lookAt([...initialTarget], initialDistance, initialRotation);
  };

  const init = () => {
    updateViewAspectRatio();
    initCamera();

    recticleHLine = createLine(regl, {
        color: recticleColor,
        width: 1,
        is2d: true
      });
      recticleVLine = createLine(regl, {
        color: recticleColor,
        width: 1,
        is2d: true
      });
    scroll = createScroll(canvas);

    // Event listeners
    scroll.on('scroll', () => {
      drawRaf();
    });

    // Buffers
    normalPointsIndexBuffer = regl.buffer();
    selectedPointsIndexBuffer = regl.buffer();
    hoveredPointIndexBuffer = regl.buffer({
      usage: 'dynamic',
      type: 'float',
      length: FLOAT_BYTES // This buffer is fixed to exactly 1 point
    });
    // Set dimensions
    set({ width, height });

    // Setup event handler
    // window.addEventListener('blur', blurHandler, false);
    window.addEventListener('mousedown', mouseDownHandler, false);
    window.addEventListener('mouseup', mouseUpHandler, false);
    window.addEventListener('mousemove', mouseMoveHandler, false);
    canvas.addEventListener('mouseenter', mouseEnterCanvasHandler, false);
    canvas.addEventListener('mouseleave', mouseLeaveCanvasHandler, false);
    canvas.addEventListener('click', mouseClickHandler, false);
    // canvas.addEventListener('dblclick', mouseDblClickHandler, false);

    let points = options.data ? options.data.nodes
      .map((d) => {
        return [clip(d.x), clip(d.y), 3, 2 ]}) : new Array(1e5).fill(10)

      setPoints(points)
  };

  const destroy = () => {
    // window.removeEventListener('blur', blurHandler, false);
    // window.removeEventListener('mousedown', mouseDownHandler, false);
    // window.removeEventListener('mouseup', mouseUpHandler, false);
    // window.removeEventListener('mousemove', mouseMoveHandler, false);
    // canvas.removeEventListener('mouseenter', mouseEnterCanvasHandler, false);
    // canvas.removeEventListener('mouseleave', mouseLeaveCanvasHandler, false);
    // canvas.removeEventListener('click', mouseClickHandler, false);
    // canvas.removeEventListener('dblclick', mouseDblClickHandler, false);
    canvas = undefined;
    camera = undefined;
    regl = undefined;
    scroll.dispose();
    pubSub.clear();
  };

  init(canvas);
  let count = 100;
  let update = (options) => {
    state.scaling = options.zoom
    state.numPoints = options.nodeCount
    console.log('updating', state.numPoints)
    //camera.lookAt([0,0], count--, 0)
  }


  return {
    deselect,
    destroy,
    draw: drawRaf,
    repaint: () => {
      console.log('paint')
      withDraw(reset)();
    },
    hover,
    refresh,
    reset: withDraw(reset),
    select,
    update
  };
};

let clip = (d) => {
  return d / 3000
}

let processKMeans = (data) => {
  let position = _.flatten(data.nodes.map(d => [clip(d.x), clip(d.y) ]))
    let edges = new Array(data.edges.length * 4).fill(0);
    data.edges.forEach((edge, idx) => {
      edges[idx*4] = clip(data.nodes[edge.source].x)
      edges[idx*4+1] = clip(data.nodes[edge.source].y)
      edges[idx*4+2] = clip(data.nodes[edge.target].x)
      edges[idx*4+3] = clip(data.nodes[edge.target].y)
    });


    let dates = data.nodes.map((edge, idx) => {
      return edge.attributes.date
    })

    let color = _.flatten(data.nodes.map((d) => {
      let c = d3.color(d.color);
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let fboColor = color.map((d, i) => {
      return i / color.length
    })
    return {
      position,
      color,
      dates,
      fboColor
    }
  }
  let init = (options) => {
  options.regl = createRegl(options.canvas)
  if (options.data) options.attributes= processKMeans(options.data)
  options.pointSize = 20
  //options.drawLines = createDrawLines(options.regl, options)
  //options.drawNodes = createDrawNodes(options.regl, options)

  const graph = creategraph(options);
  // graph.set({backgroundImage :{src : 'https://www.seriouseats.com/recipes/images/2014/04/20140430-peeling-eggs-10.jpg', crossOrigin: true}})
    const points = options.data ? options.data.nodes
      .map((d) => {
        return [clip(d.x), clip(d.y), 3, 2 ]}) : new Array(1e5).fill(10)
    //setPoints(points);

    return graph
}

export default { init };

export { createRegl, createTextureFromUrl };
