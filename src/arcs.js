const v2 = (function() {
  // adds 1 or more v2s
  function add(a, ...args) {
    const n = a.slice();
    [...args].forEach(p => {
      n[0] += p[0];
      n[1] += p[1];
    });
    return n;
  }

  function sub(a, ...args) {
    const n = a.slice();
    [...args].forEach(p => {
      n[0] -= p[0];
      n[1] -= p[1];
    });
    return n;
  }

  function mult(a, s) {
    if (Array.isArray(s)) {
      let t = s;
      s = a;
      a = t;
    }
    if (Array.isArray(s)) {
      return [
        a[0] * s[0],
        a[1] * s[1],
      ];
    } else {
      return [a[0] * s, a[1] * s];
    }
  }

  function lerp(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
    ];
  }

  function min(a, b) {
    return [
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
    ];
  }

  function max(a, b) {
    return [
      Math.max(a[0], b[0]),
      Math.max(a[1], b[1]),
    ];
  }

  // compute the distance squared between a and b
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }

  // compute the distance between a and b
  function distance(a, b) {
    return Math.sqrt(distanceSq(a, b));
  }

  // compute the distance squared from p to the line segment
  // formed by v and w
  function distanceToSegmentSq(p, v, w) {
    const l2 = distanceSq(v, w);
    if (l2 === 0) {
      return distanceSq(p, v);
    }
    let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return distanceSq(p, lerp(v, w, t));
  }

  // compute the distance from p to the line segment
  // formed by v and w
  function distanceToSegment(p, v, w) {
    return Math.sqrt(distanceToSegmentSq(p, v, w));
  }

  return {
    add: add,
    sub: sub,
    max: max,
    min: min,
    mult: mult,
    lerp: lerp,
    distance: distance,
    distanceSq: distanceSq,
    distanceToSegment: distanceToSegment,
    distanceToSegmentSq: distanceToSegmentSq,
  };
}());



function createArcs (regl, attributes, getModel, getProjection, getView) {



function getPointOnBezierCurve(points, offset, t) {
  const invT = (1 - t);
  return v2.add(v2.mult(points[offset + 0], invT * invT * invT),
                v2.mult(points[offset + 1], 3 * t * invT * invT),
                v2.mult(points[offset + 2], 3 * invT * t * t),
                v2.mult(points[offset + 3], t * t  *t));
}

function getPointsOnBezierCurve(points, offset, numPoints) {
const cpoints = [];
for (let i = 0; i < numPoints; ++i) {
  const t = i / (numPoints - 1);
  cpoints.push(getPointOnBezierCurve(points, offset, t));
}
return cpoints;
}
let g = [
  [
    44,
    240.5
  ],
  [
    62,
    207.5
  ],
  [
    63,
    174.5
  ],
  [
    59,
    129.5
  ],
  [
    55,
    84.5
  ],
  [
    22,
    25.5
  ],
  [
    20,
    -2.5
  ],
  [
    18,
    -30.5
  ],
  [
    31,
    -53.5
  ],
  [
    36,
    -83.5
  ],
  [
    41,
    -113.5
  ],
  [
    39,
    -146.5
  ],
  [
    0,
    -146.5
  ]
]


let x = []


attributes.edges.sourcePositions.map((d, i) => {
  x.push(d)
  x.push(attributes.edges.targetPositions[i])
})

  let positionBuffer = x

  function createDrawLineCommand(regl) {
  var SIZEOF_FLOAT = 4;
  var DEFAULT_LINE_COLOR = [0, 0, 0, 1];
  var DEFAULT_BORDER_COLOR = [1, 1, 1, 1];
  var DEFAULT_LINE_WIDTH = 2;
  var DEFAULT_BORDER_WIDTH = 2;
  var tmp = {};

  function attr(propName, defaultValue, defaultStride, isNext) {
    return function(ctx, props) {
      var value = props[propName];
      if (value === undefined) return { constant: defaultValue };
      if (value.constant !== undefined) return props[propName];
      var p = (tmp.buffer = props[propName]);
      if (!p.buffer) {
        tmp.buffer = p;
        p = props;
      }
      var stride =
        p.stride === undefined ? defaultStride * SIZEOF_FLOAT : p.stride;
      var offset = p.offset === undefined ? 0 : p.offset;
      tmp.stride = stride;
      tmp.offset = offset + (isNext ? stride : 0);
      tmp.divisor = 1;
      return tmp;
    };
  }

  return regl({
    vert: `
      precision highp float;

      uniform mat4 projection, view, model;
      uniform float uAspect, uTurningAngleSafetyExtension, uScaleFactor, uPixelRatio;
      attribute vec3 aPosition, aNextPosition;
      attribute vec4 aColor, aNextColor;
      attribute float aLineWidth, aNextLineWidth;
      attribute float aBorderWidth, aNextBorderWidth;
      attribute vec4 aBorderColor, aNextBorderColor;
      attribute vec2 aLinePosition;
      varying float vOffset;
      varying vec4 vColor, vBorderColor;
      varying vec2 vStrokeEdges;

      vec2 lineNormal (vec4 p, vec4 n, float aspect) {
        return normalize((p.yx / p.w  - n.yx / n.w) * vec2(1, aspect));
      }

      void main () {
        // Compute the position of two adjacent points
        vec4 currentPoint = projection * view * model  * vec4(aPosition, 1);
        vec4 nextPoint = projection * view * model * vec4(aNextPosition, 1);

        // Compute the width
        float lineWidth = mix(aLineWidth, aNextLineWidth, aLinePosition.y);
        float borderWidth = mix(aBorderWidth, aNextBorderWidth, aLinePosition.y);
        float totalWidth = lineWidth + borderWidth * 2.0;

        // Use the aLinePosition attribute to select either the current or next point
        gl_Position = mix(currentPoint, nextPoint, aLinePosition.y);

        // Apply the screen-space offset to make a line of the correct width
        vec2 vn = lineNormal(currentPoint, nextPoint, uAspect);
          gl_Position.xy += (
          vn / vec2(-uAspect, 1) * aLinePosition.x * totalWidth +
          -vn.yx * vec2(1, uAspect) * aLinePosition.y * totalWidth * uTurningAngleSafetyExtension
        ) * gl_Position.w * uScaleFactor;

        // Pass the horizontal line offset to the fragment shader so we can
        // add a stroke to the line
        vOffset = aLinePosition.x * totalWidth;

        vColor = mix(aColor, aNextColor, aLinePosition.y);
        vBorderColor = mix(aBorderColor, aNextBorderColor, aLinePosition.y);
        vStrokeEdges = borderWidth < 1e-3 ? vec2(-100, -101) : (lineWidth + vec2(-1, 1) / uPixelRatio);
      }`,
    frag: `
precision highp float;

      varying vec4 vColor, vBorderColor;
      varying float vOffset;
      varying vec2 vStrokeEdges;

      void main () {
        gl_FragColor = mix(
          vBorderColor,
          vColor,
          smoothstep( vStrokeEdges.y,  vStrokeEdges.x, vOffset) *
          smoothstep(-vStrokeEdges.y, -vStrokeEdges.x, vOffset)
        );
      }`,
    attributes: {
      aLinePosition: [[-1, 0], [1, 0], [-1, 1], [1, 1]],
      aPosition: attr('position', null, 3),
      aNextPosition: attr('position', null, 3, true),
      aColor: attr('color', DEFAULT_LINE_COLOR, 4),
      aNextColor: attr('color', DEFAULT_LINE_COLOR, 4, true),
      aBorderColor: attr('borderColor', DEFAULT_BORDER_COLOR, 4),
      aNextBorderColor: attr('borderColor', DEFAULT_BORDER_COLOR, 4, true),
      aLineWidth: attr('width', DEFAULT_LINE_WIDTH, 1),
      aNextLineWidth: attr('width', DEFAULT_LINE_WIDTH, 1, true),
      aBorderWidth: attr('borderWidth', DEFAULT_BORDER_WIDTH, 1),
      aNextBorderWidth: attr('borderWidth', DEFAULT_BORDER_WIDTH, 1, true)
    },
    uniforms: {
      projection: getProjection,
      view: getView,
      model: getModel,
      uAspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
      uScaleFactor: (ctx, props) => ctx.pixelRatio / ctx.viewportHeight,
      uPixelRatio: (ctx, props) => ctx.pixelRatio,
      uTurningAngleSafetyExtension: (ctx, props) => {
        var turningAngle =
          (Math.PI / 180) *
          (props.maxExpectedTurningAngle === undefined
            ? 5
            : props.maxExpectedTurningAngle);
        return turningAngle < 1e-4
          ? turningAngle * 0.5
          : (1 - Math.cos(turningAngle)) / Math.sin(turningAngle);
      }
    },
    primitive: 'triangle strip',
    instances: (ctx, props) => {
      if (props.count !== undefined) return props.count - 1;
      if (props.position[0] && props.position[0].length !== undefined)
        return props.position.length - 1;
      if (props.position.length !== undefined)
        return props.position.length / 3 - 1;
      return null;
    },
    count: 4
  });
}
console.log(12312)
  let drawLines = createDrawLineCommand(regl);

  return (...args) => {
    return drawLines({
        position: positionBuffer,
    })
  }
}

export default createArcs
