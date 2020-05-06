import createOriginalRegl from 'regl'

import { GL_EXTENSIONS } from './constants'

/**
 * Get the max value of an array. helper method to be used with `Array.reduce()`.
 * @param   {number}  max  Accumulator holding the max value.
 * @param   {number}  x  Current value.
 * @return  {number}  Max value.
 */
export const arrayMax = (max, x) => (max > x ? max : x)

/**
 * Check if all GL extensions are enabled and warn otherwise
 * @param   {function}  regl  Regl instance to be tested
 * @return  {function}  Returns the Regl instance itself
 */
export const checkReglExtensions = regl => {
  if (!regl) return false
  return GL_EXTENSIONS.reduce((every, EXTENSION) => {
    if (!regl.hasExtension(EXTENSION)) {
      console.warn(
        `WebGL: ${EXTENSION} extension not supported. Scatterplot might not render properly`
      )
      return false
    }
    return every
  }, true)
}

/**
 * Create a new Regl instance with `GL_EXTENSIONS` enables
 * @param   {object}  canvas  Canvas element to be rendered on
 * @return  {function}  New Regl instance
 */
export const createRegl = canvas => {
  // const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true, antialias: false,
  //   sample: {
  //      enable: true,
  //      alpha: true,
  //      coverage: {
  //        value: 1,
  //        invert: false
  //      }
  //    },
  //
  //  })
  const extensions = []

  // Needed to run the tests properly as the headless-gl doesn't support all
  // extensions, which is fine for the functional tests.
  //
  // GL_EXTENSIONS.forEach(EXTENSION => {
  //   if (gl.getExtension(EXTENSION)) {
  //     extensions.push(EXTENSION)
  //   } else {
  //     console.warn(
  //       `WebGL: ${EXTENSION} extension not supported. Scatterplot might not render properly`
  //     )
  //   }
  // })

  return createOriginalRegl({
    extensions: GL_EXTENSIONS,
    canvas, attributes: { preserveDrawingBuffer: false} })
}

/**
 * L2 distance between a pair of 2D points
 * @param   {number}  x1  X coordinate of the first point
 * @param   {number}  y1  Y coordinate of the first point
 * @param   {number}  x2  X coordinate of the second point
 * @param   {number}  y2  Y coordinate of the first point
 * @return  {number}  L2 distance
 */
export const dist = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

/**
 * Get the bounding box of a set of 2D positions
 * @param   {array}  positions2d  2D positions to be checked
 * @return  {array}  Quadruple of form `[xMin, yMin, xMax, yMax]` defining the
 *  bounding box
 */
export const getBBox = positions2d => {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity

  for (let i = 0; i < positions2d.length; i += 2) {
    xMin = positions2d[i] < xMin ? positions2d[i] : xMin
    xMax = positions2d[i] > xMax ? positions2d[i] : xMax
    yMin = positions2d[i + 1] < yMin ? positions2d[i + 1] : yMin
    yMax = positions2d[i + 1] > yMax ? positions2d[i + 1] : yMax
  }

  return [xMin, yMin, xMax, yMax]
}

/**
 * Convert a HEX-encoded color to an RGB-encoded color
 * @param   {string}  hex  HEX-encoded color string.
 * @param   {boolean}  isNormalize  If `true` the returned RGB values will be
 *   normalized to `[0,1]`.
 * @return  {array}  Triple holding the RGB values.
 */
export const hexToRgb = (hex, isNormalize = false) =>
  hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
    )
    .substring(1)
    .match(/.{2}/g)
    .map(x => parseInt(x, 16) / 255 ** isNormalize)

/**
 * Promised-based image loading
 * @param   {string}  src  Remote image source, i.e., a URL
 * @return  {object}  Promise resolving to the image once its loaded
 */
export const loadImage = (src, isCrossOrigin = false) =>
  new Promise((accept, reject) => {
    const image = new Image()
    if (isCrossOrigin) image.crossOrigin = 'anonymous'
    image.src = src
    image.onload = () => {
      accept(image)
    }
    image.onerror = error => {
      reject(error)
    }
  })

/**
 * Create a Regl texture from an URL.
 * @param   {function}  regl  Regl instance used for creating the texture.
 * @param   {string}  url  Source URL of the image.
 * @param   {boolean}  isCrossOrigin  If `true` allow loading image from a
 *   source of another origin.
 * @return  {object}  Promise resolving to the texture object.
 */
export const createTextureFromUrl = (regl, url, isCrossOrigin = false) =>
  new Promise((resolve, reject) => {
    loadImage(url, isCrossOrigin)
      .then(image => {
        resolve(regl.texture(image))
      })
      .catch(error => {
        reject(error)
      })
  })

/**
 * Convert a HEX-encoded color to an RGBA-encoded color
 * @param   {string}  hex  HEX-encoded color string.
 * @param   {boolean}  isNormalize  If `true` the returned RGBA values will be
 *   normalized to `[0,1]`.
 * @return  {array}  Triple holding the RGBA values.
 */
export const hexToRgba = (hex, isNormalize = false) => [
  ...hexToRgb(hex, isNormalize),
  255 ** !isNormalize
]

/**
 * Tests if a string is a valid HEX color encoding
 * @param   {string}  hex  HEX-encoded color string.
 * @return  {boolean}  If `true` the string is a valid HEX color encoding.
 */
export const isHex = hex => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex)

/**
 * Tests if a number is in `[0,1]`.
 * @param   {number}  x  Number to be tested.
 * @return  {boolean}  If `true` the number is in `[0,1]`.
 */
export const isNormFloat = x => x >= 0 && x <= 1

/**
 * Tests if an array consist of normalized numbers that are in `[0,1]` only.
 * @param   {array}  a  Array to be tested
 * @return  {boolean}  If `true` the array contains only numbers in `[0,1]`.
 */
export const isNormFloatArray = a => Array.isArray(a) && a.every(isNormFloat)

/**
 * From: https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
 * @param   {Array}  point  Tuple of the form `[x,y]` to be tested.
 * @param   {Array}  polygon  1D list of vertices defining the polygon.
 * @return  {boolean}  If `true` point lies within the polygon.
 */
export const isPointInPolygon = ([px, py] = [], polygon) => {
  let x1
  let y1
  let x2
  let y2
  let isWithin = false
  for (let i = 0, j = polygon.length - 2; i < polygon.length; i += 2) {
    x1 = polygon[i]
    y1 = polygon[i + 1]
    x2 = polygon[j]
    y2 = polygon[j + 1]
    if (y1 > py !== y2 > py && px < ((x2 - x1) * (py - y1)) / (y2 - y1) + x1) { isWithin = !isWithin }
    j = i
  }
  return isWithin
}

/**
 * Tests if a variable is a string
 * @param   {*}  s  Variable to be tested
 * @return  {boolean}  If `true` variable is a string
 */
export const isString = s => typeof s === 'string' || s instanceof String

/**
 * Tests if a number is an interger and in `[0,255]`.
 * @param   {number}  x  Number to be tested.
 * @return  {boolean}  If `true` the number is an interger and in `[0,255]`.
 */
export const isUint8 = x => Number.isInteger(x) && x >= 0 && x <= 255

/**
 * Tests if an array consist of Uint8 numbers only.
 * @param   {array}  a  Array to be tested.
 * @return  {boolean}  If `true` the array contains only Uint8 numbers.
 */
export const isUint8Array = a => Array.isArray(a) && a.every(isUint8)

/**
 * Tests if an array is encoding an RGB color.
 * @param   {array}  rgb  Array to be tested
 * @return  {boolean}  If `true` the array hold a triple of Uint8 numbers or
 *   a triple of normalized floats.
 */
export const isRgb = rgb =>
  rgb.length === 3 && (isNormFloatArray(rgb) || isUint8Array(rgb))

/**
 * Tests if an array is encoding an RGBA color.
 * @param   {array}  rgb  Array to be tested
 * @return  {boolean}  If `true` the array hold a quadruple of Uint8 numbers or
 *   a quadruple of normalized floats.
 */
export const isRgba = rgba =>
  rgba.length === 4 && (isNormFloatArray(rgba) || isUint8Array(rgba))

/**
 * Fast version of `Math.max`. Based on
 *   https://jsperf.com/math-min-max-vs-ternary-vs-if/24 `Math.max` is not
 *   very fast
 * @param   {number}  a  Value A
 * @param   {number}  b  Value B
 * @return  {boolean}  If `true` A is greater than B.
 */
export const max = (a, b) => (a > b ? a : b)

/**
 * Fast version of `Math.min`. Based on
 *   https://jsperf.com/math-min-max-vs-ternary-vs-if/24 `Math.max` is not
 *   very fast
 * @param   {number}  a  Value A
 * @param   {number}  b  Value B
 * @return  {boolean}  If `true` A is smaller than B.
 */
export const min = (a, b) => (a < b ? a : b)

/**
 * Normalize an array
 * @param   {array}  a  Array to be normalized.
 * @return  {array}  Normalized array.
 */
export const normNumArray = a => a.map(x => x / a.reduce(arrayMax, -Infinity))

/**
 * Convert a color to an RGBA color
 * @param   {*}  color  Color to be converted. Currently supports:
 *   HEX, RGB, or RGBA.
 * @param   {boolean}  isNormalize  If `true` the returned RGBA values will be
 *   normalized to `[0,1]`.
 * @return  {array}  Quadruple defining an RGBA color.
 */
export const toRgba = (color, isNormalize) => {
  if (isRgba(color)) {
    return isNormalize && !isNormFloatArray(color)
      ? normNumArray(color)
      : color
  }
  if (isRgb(color)) {
    return [
      ...(isNormalize ? normNumArray(color) : color),
      255 ** !isNormalize
    ]
  }
  if (isHex(color)) return hexToRgba(color, isNormalize)
  console.warn(
    'Only HEX, RGB, and RGBA are handled by this function. Returning white instead.'
  )
  return isNormalize ? [1, 1, 1, 1] : [255, 255, 255, 255]
}

let utils = {}
utils.getQuadraticControlPoint = function(x1, y1, x2, y2) {
   return {
     x: (x1 + x2) / 2 + (y2 - y1) / 4,
     y: (y1 + y2) / 2 + (x1 - x2) / 4
   };
 };

 /**
   * Compute the coordinates of the point positioned
   * at length t in the quadratic bezier curve.
   *
   * @param  {number} t  In [0,1] the step percentage to reach
   *                     the point in the curve from the context point.
   * @param  {number} x1 The X coordinate of the context point.
   * @param  {number} y1 The Y coordinate of the context point.
   * @param  {number} x2 The X coordinate of the ending point.
   * @param  {number} y2 The Y coordinate of the ending point.
   * @param  {number} xi The X coordinate of the control point.
   * @param  {number} yi The Y coordinate of the control point.
   * @return {object}    {x,y}.
 */
utils.getPointOnQuadraticCurve = function(t, x1, y1, x2, y2, xi, yi) {
   // http://stackoverflow.com/a/5634528
   return {
     x: Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * xi + Math.pow(t, 2) * x2,
     y: Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * yi + Math.pow(t, 2) * y2
   };
 };

 /**
   * Compute the coordinates of the point positioned
   * at length t in the cubic bezier curve.
   *
   * @param  {number} t  In [0,1] the step percentage to reach
   *                     the point in the curve from the context point.
   * @param  {number} x1 The X coordinate of the context point.
   * @param  {number} y1 The Y coordinate of the context point.
   * @param  {number} x2 The X coordinate of the end point.
   * @param  {number} y2 The Y coordinate of the end point.
   * @param  {number} cx The X coordinate of the first control point.
   * @param  {number} cy The Y coordinate of the first control point.
   * @param  {number} dx The X coordinate of the second control point.
   * @param  {number} dy The Y coordinate of the second control point.
   * @return {object}    {x,y} The point at t.
 */
utils.getPointOnBezierCurve =
   function(t, x1, y1, x2, y2, cx, cy, dx, dy) {
   // http://stackoverflow.com/a/15397596
   // Blending functions:
   var B0_t = Math.pow(1 - t, 3),
       B1_t = 3 * t * Math.pow(1 - t, 2),
       B2_t = 3 * Math.pow(t, 2) * (1 - t),
       B3_t = Math.pow(t, 3);

   return {
     x: (B0_t * x1) + (B1_t * cx) + (B2_t * dx) + (B3_t * x2),
     y: (B0_t * y1) + (B1_t * cy) + (B2_t * dy) + (B3_t * y2)
   };
 };

 /**
  * Return the coordinates of the two control points for a self loop (i.e.
  * where the start point is also the end point) computed as a cubic bezier
  * curve.
  *
  * @param  {number} x    The X coordinate of the node.
  * @param  {number} y    The Y coordinate of the node.
  * @param  {number} size The node size.
  * @return {x1,y1,x2,y2} The coordinates of the two control points.
  */
utils.getSelfLoopControlPoints = function(x , y, size) {
   return {
     x1: x - size * 7,
     y1: y,
     x2: x,
     y2: y + size * 7
   };
 };

 /**
  * Return the euclidian distance between two points of a plane
  * with an orthonormal basis.
  *
  * @param  {number} x1  The X coordinate of the first point.
  * @param  {number} y1  The Y coordinate of the first point.
  * @param  {number} x2  The X coordinate of the second point.
  * @param  {number} y2  The Y coordinate of the second point.
  * @return {number}     The euclidian distance.
  */
utils.getDistance = function(x0, y0, x1, y1) {
   return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
 };

 /**
  * Return the coordinates of the intersection points of two circles.
  *
  * @param  {number} x0  The X coordinate of center location of the first
  *                      circle.
  * @param  {number} y0  The Y coordinate of center location of the first
  *                      circle.
  * @param  {number} r0  The radius of the first circle.
  * @param  {number} x1  The X coordinate of center location of the second
  *                      circle.
  * @param  {number} y1  The Y coordinate of center location of the second
  *                      circle.
  * @param  {number} r1  The radius of the second circle.
  * @return {xi,yi}      The coordinates of the intersection points.
  */
utils.getCircleIntersection = function(x0, y0, r0, x1, y1, r1) {
   // http://stackoverflow.com/a/12219802
   var a, dx, dy, d, h, rx, ry, x2, y2;

   // dx and dy are the vertical and horizontal distances between the circle
   // centers:
   dx = x1 - x0;
   dy = y1 - y0;

   // Determine the straight-line distance between the centers:
   d = Math.sqrt((dy * dy) + (dx * dx));

   // Check for solvability:
   if (d > (r0 + r1)) {
       // No solution. circles do not intersect.
       return false;
   }
   if (d < Math.abs(r0 - r1)) {
       // No solution. one circle is contained in the other.
       return false;
   }

   //'point 2' is the point where the line through the circle intersection
   // points crosses the line between the circle centers.

   // Determine the distance from point 0 to point 2:
   a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

   // Determine the coordinates of point 2:
   x2 = x0 + (dx * a / d);
   y2 = y0 + (dy * a / d);

   // Determine the distance from point 2 to either of the intersection
   // points:
   h = Math.sqrt((r0 * r0) - (a * a));

   // Determine the offsets of the intersection points from point 2:
   rx = -dy * (h / d);
   ry = dx * (h / d);

   // Determine the absolute intersection points:
   var xi = x2 + rx;
   var xi_prime = x2 - rx;
   var yi = y2 + ry;
   var yi_prime = y2 - ry;

   return {xi: xi, xi_prime: xi_prime, yi: yi, yi_prime: yi_prime};
 };

 /**
   * Check if a point is on a line segment.
   *
   * @param  {number} x       The X coordinate of the point to check.
   * @param  {number} y       The Y coordinate of the point to check.
   * @param  {number} x1      The X coordinate of the line start point.
   * @param  {number} y1      The Y coordinate of the line start point.
   * @param  {number} x2      The X coordinate of the line end point.
   * @param  {number} y2      The Y coordinate of the line end point.
   * @param  {number} epsilon The precision (consider the line thickness).
   * @return {boolean}        True if point is "close to" the line
   *                          segment, false otherwise.
 */
utils.isPointOnSegment = function(x, y, x1, y1, x2, y2, epsilon) {
   // http://stackoverflow.com/a/328122
   var crossProduct = Math.abs((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)),
       d = sigma.utils.getDistance(x1, y1, x2, y2),
       nCrossProduct = crossProduct / d; // normalized cross product

   return (nCrossProduct < epsilon &&
    Math.min(x1, x2) <= x && x <= Math.max(x1, x2) &&
    Math.min(y1, y2) <= y && y <= Math.max(y1, y2));
 };

 /**
   * Check if a point is on a quadratic bezier curve segment with a thickness.
   *
   * @param  {number} x       The X coordinate of the point to check.
   * @param  {number} y       The Y coordinate of the point to check.
   * @param  {number} x1      The X coordinate of the curve start point.
   * @param  {number} y1      The Y coordinate of the curve start point.
   * @param  {number} x2      The X coordinate of the curve end point.
   * @param  {number} y2      The Y coordinate of the curve end point.
   * @param  {number} cpx     The X coordinate of the curve control point.
   * @param  {number} cpy     The Y coordinate of the curve control point.
   * @param  {number} epsilon The precision (consider the line thickness).
   * @return {boolean}        True if (x,y) is on the curve segment,
   *                          false otherwise.
 */
utils.isPointOnQuadraticCurve =
   function(x, y, x1, y1, x2, y2, cpx, cpy, epsilon) {
   // Fails if the point is too far from the extremities of the segment,
   // preventing for more costly computation:
   var dP1P2 = sigma.utils.getDistance(x1, y1, x2, y2);
   if (Math.abs(x - x1) > dP1P2 || Math.abs(y - y1) > dP1P2) {
     return false;
   }

   var dP1 = sigma.utils.getDistance(x, y, x1, y1),
       dP2 = sigma.utils.getDistance(x, y, x2, y2),
       t = 0.5,
       r = (dP1 < dP2) ? -0.01 : 0.01,
       rThreshold = 0.001,
       i = 100,
       pt = sigma.utils.getPointOnQuadraticCurve(t, x1, y1, x2, y2, cpx, cpy),
       dt = sigma.utils.getDistance(x, y, pt.x, pt.y),
       old_dt;

   // This algorithm minimizes the distance from the point to the curve. It
   // find the optimal t value where t=0 is the start point and t=1 is the end
   // point of the curve, starting from t=0.5.
   // It terminates because it runs a maximum of i interations.
   while (i-- > 0 &&
     t >= 0 && t <= 1 &&
     (dt > epsilon) &&
     (r > rThreshold || r < -rThreshold)) {
     old_dt = dt;
     pt = sigma.utils.getPointOnQuadraticCurve(t, x1, y1, x2, y2, cpx, cpy);
     dt = sigma.utils.getDistance(x, y, pt.x, pt.y);

     if (dt > old_dt) {
       // not the right direction:
       // halfstep in the opposite direction
       r = -r / 2;
       t += r;
     }
     else if (t + r < 0 || t + r > 1) {
       // oops, we've gone too far:
       // revert with a halfstep
       r = r / 2;
       dt = old_dt;
     }
     else {
       // progress:
       t += r;
     }
   }

   return dt < epsilon;
 };


 /**
   * Check if a point is on a cubic bezier curve segment with a thickness.
   *
   * @param  {number} x       The X coordinate of the point to check.
   * @param  {number} y       The Y coordinate of the point to check.
   * @param  {number} x1      The X coordinate of the curve start point.
   * @param  {number} y1      The Y coordinate of the curve start point.
   * @param  {number} x2      The X coordinate of the curve end point.
   * @param  {number} y2      The Y coordinate of the curve end point.
   * @param  {number} cpx1    The X coordinate of the 1st curve control point.
   * @param  {number} cpy1    The Y coordinate of the 1st curve control point.
   * @param  {number} cpx2    The X coordinate of the 2nd curve control point.
   * @param  {number} cpy2    The Y coordinate of the 2nd curve control point.
   * @param  {number} epsilon The precision (consider the line thickness).
   * @return {boolean}        True if (x,y) is on the curve segment,
   *                          false otherwise.
 */
utils.isPointOnBezierCurve =
   function(x, y, x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2, epsilon) {
   // Fails if the point is too far from the extremities of the segment,
   // preventing for more costly computation:
   var dP1CP1 = sigma.utils.getDistance(x1, y1, cpx1, cpy1);
   if (Math.abs(x - x1) > dP1CP1 || Math.abs(y - y1) > dP1CP1) {
     return false;
   }

   var dP1 = sigma.utils.getDistance(x, y, x1, y1),
       dP2 = sigma.utils.getDistance(x, y, x2, y2),
       t = 0.5,
       r = (dP1 < dP2) ? -0.01 : 0.01,
       rThreshold = 0.001,
       i = 100,
       pt = sigma.utils.getPointOnBezierCurve(
         t, x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2),
       dt = sigma.utils.getDistance(x, y, pt.x, pt.y),
       old_dt;

   // This algorithm minimizes the distance from the point to the curve. It
   // find the optimal t value where t=0 is the start point and t=1 is the end
   // point of the curve, starting from t=0.5.
   // It terminates because it runs a maximum of i interations.
   while (i-- > 0 &&
     t >= 0 && t <= 1 &&
     (dt > epsilon) &&
     (r > rThreshold || r < -rThreshold)) {
     old_dt = dt;
     pt = sigma.utils.getPointOnBezierCurve(
       t, x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2);
     dt = sigma.utils.getDistance(x, y, pt.x, pt.y);

     if (dt > old_dt) {
       // not the right direction:
       // halfstep in the opposite direction
       r = -r / 2;
       t += r;
     }
     else if (t + r < 0 || t + r > 1) {
       // oops, we've gone too far:
       // revert with a halfstep
       r = r / 2;
       dt = old_dt;
     }
     else {
       // progress:
       t += r;
     }
   }

   return dt < epsilon;
 };

export default utils;
