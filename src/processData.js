import * as d3 from 'd3'
import _ from 'lodash'
const clip = (d) => {
  return d / 3000
}

let processData = (data) => {

let colorTypes = {}

 let randomColor = data.nodes.map(d => {
   d.size = 0
   d.x = clip(d.x)
   d.y = clip(d.y)
   return [Math.random(), Math.random(), Math.random()]
 })

  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentiment = _.flatten(data.nodes.map((d) => {
    return + d.sentiment
  }));


  var sentimentScale = d3.scaleLinear()
  .domain([-1, 1])
    .range(['red', 'yellow', 'green']);


  let sentimentColor = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(sentimentScale(+ d.sentiment));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  data.edges.forEach(d => {
    //if (! data.nodes[d.target] ) debugger
    data.nodes[d.target].size += 1
    data.nodes[d.source].size += 1
  })
  let position =
  (data.nodes.map((d, id) => [(d.x), (d.y), d.size, id]))


    let edges = {
      sourcePositions: new Array(position.length).fill(0),
      targetPositions: new Array(position.length).fill(0),
      curves: new Array(data.edges.length).fill(0),
      edges: data.edges
    };
    data.edges.forEach((edge, idx) => {
      let source = data.nodes[edge.source], target = data.nodes[edge.target];

      edges.sourcePositions[idx*2] = (source.x)
      edges.sourcePositions[idx*2+1] = (source.y)
      edges.targetPositions[idx*2] = (target.x)
      edges.targetPositions[idx*2+1] = (target.y)

      edges.curves[idx] = {
        x1: (source.x),
        y1: (source.y),
        x2: (target.x),
        y2: (target.y),
      }
    });

let edgeColors = new Array(data.edges.length * 3).fill(0);


let parseColor = (rgb) => {
  let c = d3.rgb(rgb)
  return [c.r /255 , c.g /255 , c.b /255];
}
    let clusters = {}
    let colorValues = {}
    data.cluster_events.forEach((c) => {
      let stuff = clusters[c.type] = []
      let val = colorValues[c.type] = []
      c.clusters.forEach((cluster, clusterIndex) => {
        val[clusterIndex] = parseColor(cluster.color)
        cluster.nodes.forEach(id => {
          stuff[id] = parseColor(cluster.color)

        })
      })

    })
    console.log('va', colorValues)


    let stateIndex = new Array(data.nodes.length).fill(0);

    //data.cluster_events.forEach(c => {
    let c = data.cluster_events[0]
      c.clusters.forEach(cluster => {
        //console.log('wat', cluster)

        cluster.nodes.forEach(id => {
          stateIndex[id] = [cluster.cluster_id, 1]
        })
      })
    //})

    //console.log(stateIndex)

      data.edges.forEach((edge, idx) => {
        //console.log(`%c ${edge.target}`, 'background: green;');
        let color = (data.nodes[edge.source] ? data.nodes[edge.source] : getNode(edge.target)).color
        let c = d3.rgb(color);
        edgeColors[idx*3] = c.r / 255
        edgeColors[idx*3+1] = c.g / 255
        edgeColors[idx*3+2] = c.b / 255
    });






    let dates = data.nodes.map((d, idx) => {
      return d.create_time || + (new Date(+(new Date()) - Math.floor(Math.random()*10000000000))
);
    })
    let color = _.flatten(data.nodes.map((d) => {

      let c = d3.color(d.color || 'pink');
      return [c.r /255 , c.g /255 , c.b /255];
    }));


    console.log(colorTypes)
    return {
      nodes: data.nodes,
      colorValues: colorValues,
      colorTypes: _.extend(colorTypes, {
          general: clusters.general,
          specific: clusters.specific,
          sentiment: sentimentColor,
          random: randomColor,
          merge: clusters.general.map(d => [.9, .3, .5])

      }),
      position,
      edges,
      edgeColors,
      color,
      dates,
      sentiment,
      stateIndex

  }
}



export default processData;
