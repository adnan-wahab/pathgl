function brushended() {
  graph.repaint();
  const selection = d3.event.selection;
  if (!d3.event.sourceEvent || !selection) return;
  const [x0, x1] = selection.map(d => interval.round(x.invert(d)));
  console.log(x0, x1)
  window.getAdnan = () => {return [+x0, +x1]}

  d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
}



  let colorscale = d3.scaleLinear().domain([-0.15, 0, 0.15]).range([d3.interpolatePuOr(0), d3.interpolatePuOr(.5), d3.interpolatePuOr(1)]).clamp(true)
  let toColor = (color) => {
    let c = d3.rgb(colorscale(color))
    return [c.r / 255, c.g / 255, c.b / 255]
  }
  let loadTSV = async () => {
    let position = []
    let color = []
    window.color = color
    let tsv = await d3.tsv("./data/d.tsv", d3.autoType);
    tsv.forEach(d => {
      position.push(d.x, d.y )
      color.push.apply(color, toColor(d.sentiment))
    })
    let pointList = position
    .map((d, idx) => {
      return [clip(d.x), clip(d.y), d.uuid || d.id]
    })

    if (! graph)
      graph = GraphRenderer.init({attributes: {position, color, pointList}, canvas: canvas })
    else {
      graph.setProps({attributes: {position, color }})
    }
  }
