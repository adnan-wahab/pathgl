var Bezier = require('bezier-js')

const commands = require("./src/commands");



function createCurves (regl, attributes, getModel, getProjection, getView) {

  const interleavedStripRoundCapJoin3DDEMO = commands.interleavedStripRoundCapJoin3DDEMO(
    regl,
    16
  );

  let positions = []

  attributes.edges.curves.forEach((d, i ) => {
  var curve = new Bezier(d.x1, d.y1 , d.x2, d.y1 , d.x2, d.y2);
  var LUT = curve.getLUT(50);
  LUT.forEach(function(p) { positions.push([p.x, p.y, 0]) });
  //LUT.forEach(function(p) { positions.push(Math.random(), Math.random()) });

})
let segments = 0
let view = new Float64Array([5.554607391357422, 0, 0, 0, 0, 5.554607391357422, 0, 0, 0, 0, 1, 0, -0.527761697769165, 0.8586031794548035, 0, 1])
let colors = positions.map( d => [Math.random(),Math.random(),Math.random()] )

  view = getView()
    let pos = regl.buffer(positions)
    let color = regl.buffer(colors)

    return () => {
      segments++
     pos({ data: positions });
     color({ data: colors });
      return interleavedStripRoundCapJoin3DDEMO({
        points: pos,
        color: color,
        width: 2,
        model: getModel,
        view: view, //view,
        projection: [0.6674917491749175, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        resolution: [window.innerWidth, window.innerHeight],
        segments: segments,
        viewport: { x: 0, y: 0, width: innerWidth, height: innerHeight },
      });
    }
}

export default createCurves
