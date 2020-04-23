var Bezier = require('bezier-js')

const commands = require("./src/commands");



function createCurves (regl, attributes, getModel, getProjection, getView) {

  const interleavedStripRoundCapJoin3DDEMO = commands.interleavedStripRoundCapJoin3DDEMO(
    regl,
    16
  );

  let positions = []

  let fillPosition = (d) => {
    var curve = new Bezier(d.x1, d.y1 , d.x2, d.y1 , d.x2, d.y2);
    var LUT = curve.getLUT(50);
    LUT.forEach(function(p) { positions.push([p.x, p.y, 0]) });
    //LUT.forEach(function(p) { positions.push(Math.random(), Math.random()) });
  }

  attributes.edges.curves.forEach(fillPosition)
  let segments = 0
  let view = new Float64Array([5.554607391357422, 0, 0, 0, 0, 5.554607391357422, 0, 0, 0, 0, 1, 0, -0.527761697769165, 0.8586031794548035, 0, 1])

  view = getView()
  let colors = positions.map( d => [Math.random(),Math.random(),Math.random()] )

  let pos = regl.buffer(positions)
  let color = regl.buffer(colors)
  let update =  (node, id) => {
      let connections = attributes.edges.edges.filter(edge => {
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
      //console.log(positions)

      segments=positions.length

      let colors = positions.map( d => [Math.random(),Math.random(),Math.random()] )
      console.log(positions, segments)
      pos({data: positions})
      color({data: colors})


    }

    let draw = () => interleavedStripRoundCapJoin3DDEMO({
      points: pos,
      color: color,
      width: 10,
      model: getModel,
      view: view, //view,
      projection: [0.6674917491749175, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      resolution: [window.innerWidth, window.innerHeight],
      segments: segments / 2,
      viewport: { x: 0, y: 0, width: innerWidth, height: innerHeight },
    })
    return [update, draw]
}

export default createCurves
