// /* eslint no-console: 0 */
//
import GraphRenderer from '../src';
import * as d3 from 'd3'

let url = [
  'thecut.json',
  'mobile-banking.json',
  'd.tsv',
  '10samps.json'
]

const clip = (d) => {
return d / 3000
}

let canvas = document.createElement('canvas')

let main = () => {
  document.body.appendChild(canvas)

  let container = d3.select('body')
  .style('overflow', 'hidden')
  .append('div')
  .attr('class', 'sidebar')

  canvas.height = innerHeight
  canvas.width = innerWidth
  console.log('hi', container.node())

  container.selectAll('a').data(url).enter()
  .append('div')
  .append('a').text((d) => d)
  .attr('href', (d) => `./data/${d}`)
  .on('click', d => {
    if (d3.event.target.href.includes('tsv')) loadTSV()
    else load(d3.event.target.href)
    window.location.hash = d
    d3.event.preventDefault()
  })
  load(`./data/${window.location.hash.slice(1) || 'thecut.json'}`)

  document.title = 'REGL NETWORK VIS'
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

d3.select('#size').on('change', () => {
  console.log(d3.event.target.value / 100);
  graph.setState({sizeAttenuation: d3.event.target.value / 100});
})

d3.select('#nodes').on('change', () => {
  graph.setState({showNodes: d3.event.target.checked });
})

d3.select('#line-colors').on('change', () => {
  graph.setState({edgeColors: d3.event.target.checked });
})


d3.select('#lines').on('change', () => {
  graph.setState({showLines: d3.event.target.checked});
})

let makeRandom = () => {
  return new Date(2019, Math.random() * 12 | 0, Math.random() * 30 | 0)
}

let graph

let favorites = []

let processData = (data) => {

  let pointList = data.nodes
      .map((d, idx) => {
        return [clip(d.x), clip(d.y), d.uuid || d.id]
      })
  data.pointList = pointList

  let points = {}
  data.nodes.forEach(d => points[d.uuid || d.id] = d)

  let getNode = (id) => {
    return points[id]
  }

 let colors = data.nodes.map(d => {
   return [Math.random(), ]
 })

  let position = _.flatten(data.nodes.map(d => [clip(d.x), clip(d.y)]))
  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentimentValue = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  let counts = {}
  data.edges.forEach(d => {
    counts[d.target] = counts[d.target]
  })

    let edges = {
      sourcePositions: new Array(data.edges.length * 2).fill(0),
      targetPositions: new Array(data.edges.length * 2).fill(0),
    };
    data.edges.forEach((edge, idx) => {
      let source = getNode(edge.source), target = getNode(edge.target);
      //if( ! source || ! target ) debugger
      edges.sourcePositions[idx*2] = clip(source.x)
      edges.sourcePositions[idx*2+1] = clip(source.y)
      edges.targetPositions[idx*2] = clip(target.x)
      edges.targetPositions[idx*2+1] = clip(target.y)
    });

    let edgeColors = new Array(data.edges.length * 3).fill(0);
    if (data.kmeans) {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        nodes.forEach(id => getNode(id).color = color)

      })
    }

      data.edges.forEach((edge, idx) => {
        //console.log(`%c ${edge.target}`, 'background: green;');
        let color = (data.nodes[edge.source] ? data.nodes[edge.source] : getNode(edge.target)).color
        let c = d3.rgb(color);
        edgeColors[idx*3] = c.r / 255
        edgeColors[idx*3+1] = c.g / 255
        edgeColors[idx*3+2] = c.b / 255
    });

    let dates = data.nodes.map((d, idx) => {
      return d.create_time || (Math.random() * new Date());
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



    return {
      position,
      counts,
      edges,
      edgeColors,
      color,
      dates,
      sentimentValue,
      stateIndex,
      pointList

  }
}

let processTSV = () => {

}

let load = (url) => {
  if (url.includes('.tsv')) return loadTSV(window.location.tsv)
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      let attributes = processData(json)

      if (! graph)
        graph = GraphRenderer.init({
          attributes,
          canvas: canvas,
          onClick: (point, idx, events) => {
            if (events.shiftKey)favorites = favorites.concat(idx)

            graph.setState({favorites})
          }
        })
      else {
        graph.setState({favorites: favorites = []})
        graph.setProps({ attributes })
      }
    })
}
d3.select(window).on('load', main)

function brushended() {
  graph.repaint();
  const selection = d3.event.selection;
  if (!d3.event.sourceEvent || !selection) return;
  const [x0, x1] = selection.map(d => interval.round(x.invert(d)));
  console.log(x0, x1)
  window.getAdnan = () => {return [+x0, +x1]}

  d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
}
