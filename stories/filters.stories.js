import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Filter Tests' };
import createGraphOnce from './singleton';


export const dateFilter = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})
  let div = document.createElement('div')

  let input = document.createElement('input')
  input.type = 'date'
  div.appendChild(input)


  div.appendChild(canvas)
  console.log(div)
  return div
};

export const sentimentFilter = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})


  let div = document.createElement('div')
  div.innerHTML = `
  <div>
    <input type="radio" id="huey" name="drone" value="huey"
           checked>
    <label for="huey">Positive</label>
  </div>

  <div>
    <input type="radio" id="dewey" name="drone" value="dewey">
    <label for="dewey">Negative</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="louie">
    <label for="louie">Normal</label>
  </div>
  `


  div.appendChild(canvas)
  return div
};
