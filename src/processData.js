import * as d3 from 'd3'

const clip = (d) => {
  return d / 3000
}


let processData = (props) => {
  let data = props.data

  const points = props.data ? props.data.nodes
    .map((d, idx) => {
      return [clip(d.x), clip(d.y), d.uuid]
    }) : new Array(1e5).fill(10)

  props.data.points = {}
  props.data.nodes.forEach(d => points[d.uuid || d.id] = d)

  data.points = points;

  let getNode = (id) => {
    return data.points[id]
  }


 let colors = data.nodes.map(d => {
   return [Math.random(), ]
 })

  let position = _.flatten(data.nodes.map(d => [clip(d.x), clip(d.y), d.size]))
  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentimentValue = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  let counts = {}
  data.edges.forEach(d => {
    counts[d.target] = counts[d.target]
  })
  console.log('counts', counts)

    let edges = new Array(data.edges.length * 4).fill(0);
    data.edges.forEach((edge, idx) => {
      let source = getNode(edge.source), target = getNode(edge.target);
      if( ! source || ! target ) debugger
      edges[idx*4] = clip(source.x)
      edges[idx*4+1] = clip(source.y)
      edges[idx*4+2] = clip(target.x)
      edges[idx*4+3] = clip(target.y)
    });
    window.x = data.edges
    window.points = points

    let edgeColors = new Array(data.edges.length * 3).fill(0);
    if (data.kmeans) {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        nodes.forEach(id => getNode(id).color = color)

      })
    } else {
      data.edges.forEach((edge, idx) => {
      let color = data.nodes[edge.source]?.color
      let c = d3.rgb(color);
      edgeColors[idx*4+1] = c.r / 255
      edgeColors[idx*4+2] = c.g / 255
      edgeColors[idx*4+3] = c.b / 255
    });
  }

    let dates = data.nodes.map((edge, idx) => {
      return (edge.attributes || {}).date
    })
    let color = _.flatten(data.nodes.map((d) => {
      let c = d3.color(d.color || 'pink');
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let legend = Object.entries(data.kmeans || {}).map(d => d[1].color);

    let stateIndex = _.flatten(data.nodes.map((d) => {
      let c = d.color
      return legend.indexOf(c);
    }));


    let fboColor = color.map((d, i) => {
      return i / color.length
    })



    return {
      position,
      counts,
      edges,
      edgeColors,
      color,
      //dates,
      //
      fboColor,
      sentimentValue,
      stateIndex
    }
  }

  export default processData
