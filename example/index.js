// /* eslint no-console: 0 */
//
import GraphRenderer from '../src';
import * as d3 from 'd3'

let url = [
  // 'eastwestcommute',
  // 'philippines',
  // 'sfcommute',
  // 'world',
  'dataKMeans',
  'mobile-banking'
]

let canvas = document.createElement('canvas')

let main = () => {
  document.body.appendChild(canvas)
  let container = d3.select('body').append('div')
  .attr('class', 'sidebar')

  canvas.height = innerHeight
  canvas.width = innerWidth
  console.log('hi', container.node())

  container.selectAll('a').data(url).enter()
  .append('div')
  .append('a').text((d) => d)
  .attr('href', (d) => `./data/${d}.json`)
  .on('click', d => {
    load(d3.event.target.href)
    d3.event.preventDefault()
  })
  load('./data/dataKMeans.json')
}

let makeRandom = () => {
  return new Date(2019, Math.random() * 12 | 0, Math.random() * 30 | 0)
}

let graph

let load = (url) => {
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      console.log(json)

      json.nodes.forEach (d => {if (! d.attributes.date) d.attributes.date = makeRandom()} )

      let points = json.nodes;
      window.nodes = points

      graph = GraphRenderer.init({ data: json, canvas: canvas,
        onHover: (id) => {
          d3.select('.hover').text(
            JSON.stringify(points[id] && points[id].label)
          )
        },
        onClick: (id) => {
          console.log(id, graph.stars)
          d3.select('.stars').text(
              JSON.stringify(id)
            )
        }
       })
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
