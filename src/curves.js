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

  let pos = regl.buffer()
  let color = regl.buffer()

  let update =  (node, id) => {
    console.log('WHY',getProjection())
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
      pos({data: positions})
      color({data: colors})

      // pos.subdata(positions)
      // color.subdata(color)
    }

    let draw = () => {
    if (segments.length) interleavedStripRoundCapJoin3DDEMO({
      points: pos,
      color: color,
      width: 5,
      model: getModel,
      view: view, //view,
      projection: getProjection,
      resolution: [window.innerWidth, window.innerHeight],
      segments: segments - 1,
      viewport: { x: 0, y: 0, width: innerWidth, height: innerHeight },
    })
  }
    return [update, draw]
}

export default createCurves
