
function createArcs (regl, attributes, getModel, getProjection, getView) {

 //  let positions = [];
 // const NUM_SEGMENTS = 10;
 // /*
 //  *  (0, -1)-------------_(1, -1)
 //  *       |          _,-"  |
 //  *       o      _,-"      o
 //  *       |  _,-"          |
 //  *   (0, 1)"-------------(1, 1)
 //  */
 // for (let i = 0; i < NUM_SEGMENTS; i++) {
 //   positions = positions.concat([i, -1, 0, i, 1, 0]);
 // }

 let positions = [
   -0.5,0.5,0.0,
   -0.5,-0.5,0.0,
   0.5,-0.5,0.0,
   0.5,0.5,0.0
];

  if (! attributes.edges) return () => {}
  //attributes.edges = attributes.edges.filter((d, i) => )
  // make sure to respect system limitations.
  // positions = [];
  //   const NUM_SEGMENTS = 50;
  //   /*
  //    *  (0, -1)-------------_(1, -1)
  //    *       |          _,-"  |
  //    *       o      _,-"      o
  //    *       |  _,-"          |
  //    *   (0, 1)"-------------(1, 1)
  //    */
  //   for (let i = 0; i < NUM_SEGMENTS; i++) {
  //     console.log(i)
  //     positions = positions.concat([i, -1, 0, i, 1, 0]);
  //   }
    window.positions= positions
  let N = attributes.edges.sourcePositions.length
  let x = [{x: -1, y: 1, z: 0},
 {x: -0.75, y: 1, z: 0},
 {x: -0.5, y: 1, z: 0},
 {x: -0.25, y: 1, z: 0},
 {x: 0, y: 1, z: 0},
 {x: 0.25, y: 1, z: 0},
 {x: 0.5, y: 1, z: 0},
 {x: 0.75, y: 1, z: 0},
 {x: 1, y: 1, z: 0},
 {x: -1, y: -1, z: 0},
 {x: -0.75, y: -1, z: 0},
 {x: -0.5, y: -1, z: 0},
 {x: -0.25, y: -1, z: 0},
 {x: 0, y: -1, z: 0},
 {x: 0.25, y: -1, z: 0},
 {x: 0.5, y: -1, z: 0},
 {x: 0.75, y: -1, z: 0},
 {x: 1, y: -1, z: 0}].map(d =>  [d.x, d.y])
window.N = N
    let draw = regl({
      frag: `
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;
      varying vec3 v_color;
      varying vec2 vCoord;

      uniform float opacity;
      uniform float time;
      uniform bool edgeColors;
      float aastep (float threshold, float value) {
        float afwidth = fwidth(value) * 0.5;
        return smoothstep(threshold - afwidth, threshold + afwidth, value);
      }

      void main() {
        float repeat = 100.0;

// How big is the gap between each dash
float gapSize = 0.25;

// Create a dashed line
float dash = abs(fract(vCoord.x * repeat) - 0.5);

// Smooth the dashed line to sharp/crisp anti-aliasing
dash = 1.0 - aastep(gapSize, dash);

gl_FragColor = vec4(vec3(dash).rg, sin(time), 1.0);
      }`,

      vert: `
      varying vec3 v_color;
      varying vec2 vCoord;

      precision mediump float;
      attribute vec2 position;
      attribute vec3 color;

      uniform mat4 projection, view;
      uniform mat4 model;

      uniform float numSegments;
      uniform float opacity;

attribute vec2 sourcePositions;
attribute vec2 targetPositions;

uniform vec2 project_uViewportSize;

      float paraboloid(vec3 source, vec3 target, float ratio) {
  // d: distance on the xy plane
  // r: ratio of the current point
  // p: ratio of the peak of the arc
  // h: height multiplier
  // z = f(r) = sqrt(r * (p * 2 - r)) * d * h
  // f(0) = 0
  // f(1) = dz
  vec3 delta = target - source;
  float dh = length(delta.xy) * 1.;
  float unitZ = delta.z / dh;
  float p2 = unitZ * unitZ + 1.0;
  // sqrt does not deal with negative values, manually flip source and target if delta.z < 0
  float dir = step(delta.z, 0.0);
  float z0 = mix(source.z, target.z, dir);
  float r = mix(ratio, 1.0 - ratio, dir);
  return sqrt(r * (p2 - r)) * dh + z0;
}


      vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
        // normalized direction of the line
        vec2 dir_screenspace = normalize(line_clipspace * project_uViewportSize);
        // rotate by 90 degrees
        dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);
        return dir_screenspace * offset_direction * width / 2.0;
      }

      float getSegmentRatio(float index) {
        return smoothstep(0.0, 1.0, index / (numSegments - 1.0));
      }
      vec3 getPos(vec3 source, vec3 target, float segmentRatio) {
        float z = paraboloid(source, target, segmentRatio);
        float tiltAngle = radians(1.);
        vec2 tiltDirection = normalize(target.xy - source.xy);
        vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);
        return vec3(
          mix(source.xy, target.xy, segmentRatio) + tilt,
          z * cos(tiltAngle)
        );
      }
      #define PI 3.14
      uniform vec2 start;
      uniform vec2 end;
      uniform vec2 control;

      vec3 sample (float t) {
        // We can also adjust the per-vertex curve thickness by modifying this 0..1 number
        //float volume = 1.0;

        // Try replacing the above with:
         float volume = 1.0 * sin(t * PI);

        // Solve the quadratic curve with the start, control and end points:
        float dt = (1.0 - t);
        float dtSq = dt * dt;
        float tSq = t * t;
        float x = dtSq * start.x + 2.0 * dt * t * control.x + tSq * end.x;
        float y = dtSq * start.y + 2.0 * dt * t * control.y + tSq * end.y;
        return vec3(x, y, volume);

        // Alternatively, you can replace the above with a linear mix() operation
        // This will produce a straight line between the start and end points
        // return vec3(mix(start, end, t), volume);
      }




      void main() {
        vec2 p  = position;
        float subdivisions = 50.;
        float thickness = .1;

        v_color = color;
        v_color.x = position.x;
        //vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio);

        vec4 source = projection * view * model * vec4(sourcePositions, 0, 1);
        vec4 target = projection * view * model * vec4(targetPositions, 0, 1);
        gl_Position = projection * view * model * vec4(position, 0, 1);



        float arclen = (position.x * 0.5 + 0.5);

          // How far to offset the line thickness for this vertex in -1..1 space
          float extrusion = position.y;

          // Find next sample along curve
          float nextArclen = arclen + (1.0 / subdivisions);

          // Sample the curve in two places
          // XY is the 2D position, and the Z component is the thickness at that vertex
          vec3 current = sample(arclen);
          vec3 next = sample(nextArclen);

          // Now find the 2D perpendicular to form our line segment
          vec2 direction = normalize(next.xy - current.xy);
          vec2 perpendicular = vec2(-direction.y, direction.x);

          // Extrude
          float computedExtrusion = extrusion * (thickness / 2.0) * current.z;
          vec3 offset = current.xyz + vec3(perpendicular.xy, 0.0) * computedExtrusion;

          gl_Position = projection * view * model * vec4(offset.xyz, 1.0);
            vCoord = position.xy;
          //gl_Position = projectionMatrix * modelViewMatrix * vec4(offset.xyz, 1.0);

      }`,
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'src alpha',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one minus src alpha'
        }
      },
      //depth: { enable: true },

      attributes: {
        sourcePositions: {
          buffer: attributes.edges.sourcePositions,

        },
        targetPositions: {
          buffer: attributes.edges.targetPositions,
        },
        position:  {
          buffer:     x
        },
          color: {
            buffer: () => attributes.edgeColors,
            offset: 0
          }
      },

      uniforms: {
        time: ({time}) => time,
        thickness:  (time) => { return (Math.sin(Date.now()) * 0.5 + 0.5) * 0.1 + 0.01 },
        end: [0.5, 0.5],
        start: [.25,.25],
        control : (...args) => {
          let temp = args[0]
          let time = temp.tick
          const angle = time * 0.5 + Math.PI * 2;
          const radius = (Math.sin(time) * 0.5 + 0.5) * 2.0;
          console.log([ Math.cos(angle) * radius, Math.sin(angle) * radius ])
          return [ Math.cos(angle) * radius, Math.sin(angle) * radius ];
        },
        edgeColors: regl.prop('edgeColors'),
        opacity: 0.5,
        view: getView,
        projection: getProjection,
        model: getModel,
      },

      count: () => 4,
      instances: N,
      primitive: 'triangle strip'
    })
    window.attributes = attributes
    return (...args) => {
      draw()
    }
}

export default createArcs
