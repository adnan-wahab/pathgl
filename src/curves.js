var Bezier = require('bezier-js')

const commands = require("./src/commands");



function createCurves (regl, attributes, getModel, getProjection, getView) {

  const interleavedStripRoundCapJoin3DDEMO = commands.interleavedStripRoundCapJoin3DDEMO(
    regl,
    16
  );

  let positions = []
  let getQuadraticControlPoint = function(x1, y1, x2, y2) {
     return {
       x: (x1 + x2) / 2 + (y2 - y1) / 4,
       y: (y1 + y2) / 2 + (x1 - x2) / 4
     };
   };
  let fillPosition = (d) => {
    let cp = getQuadraticControlPoint(d.x1, d.y1 , d.x2, d.y2)
    var curve = new Bezier(d.x1, d.y1 , cp.x, cp.y , d.x2, d.y2);
    var LUT = curve.getLUT(50);
    LUT.forEach(function(p) { positions.push([p.x, p.y, .1]) });
    positions.push(0,0,0)
  }

  attributes.edges.curves.forEach(fillPosition)
  let segments = 0
  let colors = positions.map( d => [Math.random(),Math.random(),Math.random()] )

  let pos = regl.buffer()
  let color = regl.buffer()

  let update =  (node, id) => {
      let connections = attributes.edges.edges.filter(edge => {
        if (! id) return true
        return edge.source == id || edge.target == id
      }).map(d => {
        let source = attributes.nodes[d.source], target = attributes.nodes[d.target];
        return {
          x1: (source.x),
          y1: (source.y),
          x2: (target.x),
          y2: (target.y),
        }
      })

      positions = []

      connections.forEach(fillPosition)

      segments=positions.length

      let colors = positions.map( d => [.3, .3, .3]  )
      pos({data: positions})
      color({data: colors})
    }

    let draw = (state) => {
      let dim = state.containerDimensions
      console.log(state.size)
      let dpi = window.devicePixelRatio

      if (segments) interleavedStripRoundCapJoin3DDEMO({
        points: pos,
        color: color,
        width: 1,
        model: state.model,
        view: state.camera.view, //view,
        projection: state.projection,
        resolution: [state.size[0] , state.size[1] ],
        segments: segments - 1,
        viewport: { x: dim.x * dpi, y: dim.y * dpi, width: state.size[0] * dpi, height: state.size[1] * dpi  },
      })
    }
    return [update, draw]
}

export default createCurves
