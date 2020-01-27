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

let load = (url) => {
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      console.log(json)

      json.nodes.forEach (d => {if (! d.attributes.date) d.attributes.date = makeRandom()} )

      let points = json.nodes;
      const pointoverHandler = pointId => {
        console.log('Over point:', points[pointId].attributes.date);
        //const [x, y, category, value] = points[pointId];
        //onsole.log(`X: ${x}\nY: ${y}\nCategory: ${category}\nValue: ${value}`);
      };
      let s = GraphRenderer.init({ data: json, canvas: canvas })

      s.subscribe('pointover', pointoverHandler)
    })


}
let width = 1000, height = 100
let margin = {
  top: 10,
  left: 10,
  right: 10,
  bottom: 10
}

let interval = d3.timeDay.every(1)

let x = d3.scaleTime()
    .domain([new Date(2019, 1, 1), new Date(2019, 12, 30)])
    .rangeRound([margin.left, width - margin.right])

let xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(g => g.append("g")
        .call(d3.axisBottom(x)
            .ticks(interval)
            .tickSize(-height + margin.top + margin.bottom)
            .tickFormat(() => null))
        .call(g => g.select(".domain")
            .attr("fill", "#ddd")
            .attr("stroke", null))
        .call(g => g.selectAll(".tick line")
            .attr("stroke", "#fff")
            .attr("stroke-opacity", d => d <= d3.timeDay(d) ? 1 : 0.5)))
    .call(g => g.append("g")
        .call(d3.axisBottom(x)
            .ticks(d3.timeDay)
            .tickPadding(0))
        .attr("text-anchor", null)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text").attr("x", 6)))

d3.select(window).on('load', main)

const svg = d3.select('body').append("svg")
    .attr("viewBox", [0, 0, width, height]);

const brush = d3.brushX()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("end", brushended);

svg.append("g")
    .call(xAxis);

svg.append("g")
    .call(brush);

function brushended() {
  const selection = d3.event.selection;
  if (!d3.event.sourceEvent || !selection) return;
  const [x0, x1] = selection.map(d => interval.round(x.invert(d)));
  console.log(x0, x1)
  window.getAdnan = () => {return [+x0, +x1]}

  d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
}
window.svg = svg

// const canvas = document.querySelector('#canvas');
// const numPointsEl = document.querySelector('#num-points');
// const numPointsValEl = document.querySelector('#num-points-value');
// const pointSizeEl = document.querySelector('#point-size');
// const pointSizeValEl = document.querySelector('#point-size-value');
// const opacityEl = document.querySelector('#opacity');
// const opacityValEl = document.querySelector('#opacity-value');
// const resetEl = document.querySelector('#reset');
//
// let { width, height } = canvas.getBoundingClientRect();
//
// let numPoints = 100000;
// let pointSize = 2;
// let opacity = 0.33;
// let selection = [];
//
// const lassoMinDelay = 10;
// const lassoMinDist = 2;
// const showRecticle = true;
// const recticleColor = [1, 1, 0.878431373, 0.33];
//

//
// const pointoutHandler = pointId => {
//   console.log('Out point:', pointId);
//   const [x, y, category, value] = points[pointId];
//   console.log(`X: ${x}\nY: ${y}\nCategory: ${category}\nValue: ${value}`);
// };
//
// const selectHandler = ({ points: selectedPoints }) => {
//   console.log('Selected:', selectedPoints);
//   selection = selectedPoints;
//   if (selection.length === 1) {
//     const point = points[selection[0]];
//     console.log(
//       `X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${
//         point[3]
//       }`
//     );
//   }
// };
//
// const deselectHandler = () => {
//   console.log('Deselected:', selection);
//   selection = [];
// };
//
// const scatterplot = createScatterplot({
//   canvas,
//   width,
//   height,
//   lassoMinDelay,
//   lassoMinDist,
//   pointSize,
//   showRecticle,
//   recticleColor
// });
//
// console.log(`Scatterplot v${scatterplot.get('version')}`);
//
// scatterplot.subscribe('pointout', pointoutHandler);
// scatterplot.subscribe('select', selectHandler);
// scatterplot.subscribe('deselect', deselectHandler);
//
// const resizeHandler = () => {
//   ({ width, height } = canvas.getBoundingClientRect());
//   scatterplot.set({ width, height });
// };
//
// window.addEventListener('resize', resizeHandler);
//
// const generatePoints = num =>
//   new Array(num).fill().map(() => [
//     -1 + Math.random() * 2, // x
//     -1 + Math.random() * 2, // y
//     Math.round(Math.random()), // category
//     Math.random() // value
//   ]);
//
// const setNumPoint = newNumPoints => {
//   numPoints = newNumPoints;
//   numPointsEl.value = numPoints;
//   numPointsValEl.innerHTML = numPoints;
//   points = generatePoints(numPoints);
//   scatterplot.draw(points);
// };
//
// const numPointsInputHandler = event => {
//   numPointsValEl.innerHTML = `${+event.target
//     .value} <em>release to redraw</em>`;
// };
//
// numPointsEl.addEventListener('input', numPointsInputHandler);
//
// const numPointsChangeHandler = event => setNumPoint(+event.target.value);
//
// numPointsEl.addEventListener('change', numPointsChangeHandler);
//
// const setPointSize = newPointSize => {
//   pointSize = newPointSize;
//   pointSizeEl.value = pointSize;
//   pointSizeValEl.innerHTML = pointSize;
//   scatterplot.set({ pointSize });
// };
//
// const pointSizeInputHandler = event => setPointSize(+event.target.value);
//
// pointSizeEl.addEventListener('input', pointSizeInputHandler);
//
// const setOpacity = newOpacity => {
//   opacity = newOpacity;
//   opacityEl.value = opacity;
//   opacityValEl.innerHTML = opacity;
//   scatterplot.set({ opacity });
// };
//
// const opacityInputHandler = event => setOpacity(+event.target.value);
//
// opacityEl.addEventListener('input', opacityInputHandler);
//
// const resetClickHandler = () => {
//   scatterplot.reset();
// };
//
// resetEl.addEventListener('click', resetClickHandler);
//
// const colorsCat = [
//   ['#3a78aa', '#008dff', '#008dff'],
//   ['#aa3a99', '#ff00da', '#ff00da']
// ];
// scatterplot.set({ colorBy: 'category', colors: colorsCat });
//
// const colorsScale = [
//   '#002072',
//   '#162b79',
//   '#233680',
//   '#2e4186',
//   '#394d8d',
//   '#425894',
//   '#4b649a',
//   '#5570a1',
//   '#5e7ca7',
//   '#6789ae',
//   '#7195b4',
//   '#7ba2ba',
//   '#85aec0',
//   '#90bbc6',
//   '#9cc7cc',
//   '#a9d4d2',
//   '#b8e0d7',
//   '#c8ecdc',
//   '#ddf7df',
//   '#ffffe0'
// ];
// scatterplot.set({ colorBy: 'value', colors: colorsScale });
//
// setPointSize(pointSize);
// setOpacity(opacity);
// setNumPoint(numPoints);
