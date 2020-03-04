// /* eslint no-console: 0 */
//
import GraphRenderer from '../src';
import * as d3 from 'd3'

let url = [
  // 'eastwestcommute',
  // 'philippines',
  // 'sfcommute',
  // 'world',
  'thecut.json',
  'mobile-banking.json',
  'd.tsv'

]

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
  load(`./data/${window.location.hash.slice(1)}`)

  document.title = 'what'
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
    position.push(d.x / 10, d.y / 10, 0)
    color.push.apply(color,
      toColor(d.sentiment)
    )
  })

  if (! graph)
    graph = GraphRenderer.init({attributes: {position, color}, canvas: canvas })
  else {
    graph.setState({attributes: {position, color }})
  }
}

d3.select('#size').on('change', () => {
  console.log(d3.event.target.value / 100);
  graph.update({sizeAttenuation: d3.event.target.value / 100});
})

d3.select('#nodes').on('change', () => {
  graph.update({showNodes: d3.event.target.checked });
})

d3.select('#lines').on('change', () => {
  graph.update({showLines: d3.event.target.checked});
})

let makeRandom = () => {
  return new Date(2019, Math.random() * 12 | 0, Math.random() * 30 | 0)
}

let graph

let load = (url) => {
  if (url.includes('.tsv')) loadTSV(window.location.tsv)
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      //json.nodes = json.nodes.slice(0, 100)
      //json.edges = []
      console.log(json)
      if (! graph)
        graph = GraphRenderer.init({ data: json, canvas: canvas,})
      else {
        graph.setState({ data: json })
      }
    })
}
d3.select(window).on('load', main)
// let width = 1000, height = 100
// let margin = {
//   top: 10,
//   left: 10,
//   right: 10,
//   bottom: 10
// }
//
// let interval = d3.timeDay.every(1)
//
// let x = d3.scaleTime()
//     .domain([new Date(2019, 1, 1), new Date(2019, 12, 30)])
//     .rangeRound([margin.left, width - margin.right])
//
// let xAxis = g => g
//     .attr("transform", `translate(0,${height - margin.bottom})`)
//     .call(g => g.append("g")
//         .call(d3.axisBottom(x)
//             .ticks(interval)
//             .tickSize(-height + margin.top + margin.bottom)
//             .tickFormat(() => null))
//         .call(g => g.select(".domain")
//             .attr("fill", "#ddd")
//             .attr("stroke", null))
//         .call(g => g.selectAll(".tick line")
//             .attr("stroke", "#fff")
//             .attr("stroke-opacity", d => d <= d3.timeDay(d) ? 1 : 0.5)))
//     .call(g => g.append("g")
//         .call(d3.axisBottom(x)
//             .ticks(d3.timeDay)
//             .tickPadding(0))
//         .attr("text-anchor", null)
//         .call(g => g.select(".domain").remove())
//         .call(g => g.selectAll("text").attr("x", 6)))
//
//
//
// const svg = d3.select('body').append("svg")
//     .attr("viewBox", [0, 0, width, height]);
//
// const brush = d3.brushX()
//     .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
//     .on("end", brushended);
//
// svg.append("g")
//     .call(xAxis);
//
// svg.append("g")
//     .call(brush);

function brushended() {
  graph.repaint();
  const selection = d3.event.selection;
  if (!d3.event.sourceEvent || !selection) return;
  const [x0, x1] = selection.map(d => interval.round(x.invert(d)));
  console.log(x0, x1)
  window.getAdnan = () => {return [+x0, +x1]}

  d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
}
