import React from 'react'
import GraphRenderer from '../src';
import *  as d3 from 'd3'
export default { title: 'brush' };

import createGraphOnce from './singleton'
let favorites = []


export const brushSelection = () => {

  let width = innerWidth, height = innerHeight
  let [graph, canvas] = createGraphOnce({
    onClick: (id) => { console.log('clicked on node ' + id )}
  })

  const container = d3.create('div')
  //container.append(canvas)
  const svg = container.append("svg")
      .attr("viewBox", [0, 0, width, height])
      .property("value", []);

  const brush = d3.brush()
      .on("start brush", brushed)
      .on('end', ()=> {

        svg.selectAll('.selection')
        .transition().duration(500)
        .ease(d3.easeLinear)
        .attr('opacity', 0)

      })

  // const dot = svg.append("g")
  //     .attr("fill", "none")
  //     .attr("stroke", "steelblue")
  //     .attr("stroke-width", 1.5)
  //   .selectAll("g")
  //   .data(data)
  //   .join("circle")
  //     .attr("transform", d => `translate(${x(d.x)},${y(d.y)})`)
  //     .attr("r", 3);

  svg.call(brush);
  svg.selectAll('.selection').attr('stroke', 'green')//.attr('fill', 'dark-green').attr('fill-opacity', .3)

  function brushed() {
    svg.selectAll('.selection').attr('opacity', 1).attr('fill', 'none')

    let value = [];
    console.log('hi')
    if (d3.event.selection) {
      const [[x0, y0], [x1, y1]] = d3.event.selection;
      //value = data.filter(d => x0 <= x(d.x) && x(d.x) < x1 && y0 <= y(d.y) && y(d.y) < y1);
    }
    //svg.property("value", value).dispatch("input");
  }


  return container.node()
};
