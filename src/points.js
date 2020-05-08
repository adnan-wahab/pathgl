const POINT_FS = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision mediump float;

uniform vec2 selection;

varying vec4 vColor;
varying vec3 borderColor;

unfiorm vec2 resolution;
uniform float time;





void main() {
  vec2 uv = vec2(gl_FragCoord.xy / iResolution.xy) - 0.5;
  //correct aspect
  uv.x *= iResolution.x / iResolution.y;
  //animate zoom
  uv /= sin(time * 0.2);
  //radial distance
  float len = length(uv);
  //anti-alias
  len = aastep(0.5, len);
  gl_FragColor.rgb = vec3(len);
  gl_FragColor.a   = 1.0;
  // float r = 0.0, delta = 0.0, alpha = 1.0;
  // vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  // r = dot(cxy, cxy);
  //
  // #ifdef GL_OES_standard_derivatives
  //   delta = fwidth(r);
  //   alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
  // #endif
  //
  // vec3 color =   (r < 0.75) ? vColor.rgb : borderColor;
  // if (r > .95) discard;
  // gl_FragColor = vec4(color, alpha * vColor.a);
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

uniform float hoveredPoint;
uniform float selectedPoint;
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


  //if (! (dates > dateFilter.x && dates < dateFilter.y)) return;

  gl_Position = projection * view * model * vec4(position.xy, 0.0, 1.);

  vColor = vec4(color, 1.);

  float finalScaling = pow(sizeAttenuation, scaling);
  finalScaling = 4. + pow(pointSize, sizeAttenuation);

  //if (selectedCluster > -.1 && selectedCluster != stateIndex.x) finalScaling = 0.;


  finalScaling = 10.;

  if (pos.w == hoveredPoint) finalScaling = 20.;
  if (pos.w == hoveredPoint) borderColor = vec3(1);
  else borderColor = vec3(0.1411764705882353, 0.15294117647058825, 0.18823529411764706);

  if (pos.w == selectedPoint) finalScaling = 30.;
  if (pos.w == selectedPoint) vColor = vec4(1);

  if (pos.w == hoveredPoint) gl_Position.z -= .1;
  if (pos.w == selectedPoint) gl_Position.z -= .2;

  finalScaling += pos.z;
  gl_PointSize = finalScaling + pointSizeExtra;

}
`


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
      time: (ctx) => { return ctx.time },
      dateFilter: regl.prop('dateFilter'),
      selectedCluster: () => (attributes.position.length < 1 ? state.selectedCluster : -100 ),
      model: getModel,
      view: getView,
      scaling: getScaling,
      pointSize: getPointSize,
      pointSizeExtra: getPointSizeExtra,
      sizeAttenuation: regl.prop('sizeAttenuation'),
      flatSize: regl.prop('flatSize')
    },
    count: getNormalNumPoints,
    primitive: 'points'
  })
