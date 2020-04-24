import React from 'react'
import GraphRenderer from '../src';
export default { title: 'Filter Tests' };
import createGraphOnce from './singleton';


export const dateFilter = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})
  let div = document.createElement('div')

  div.innerHTML = `

  <label>start
    <input type="date" id='#start'>
  </label>

  <label>end
    <input type="date" id='#end'>
  </label>
  `
  let filter = [-1, Infinity]
  div.addEventListener('change', (e) => {
    let idx = e.target.id == '#start' ? 0 : 1
    filter[idx] = + new Date(e.target.value)
    console.log(filter, e.target.id)
    graph.setState({dateFilter: filter})
  })


  div.appendChild(canvas)

  return div
};

export const sentimentFilter = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})
  graph.setState({color: 'sentiment'})


  let div = document.createElement('div')
  div.innerHTML = `<form>
  <div>
    <input type="radio" id="huey" name="drone" value="1"
           checked>
    <label for="huey">Positive</label>
  </div>

  <div>
    <input type="radio" id="dewey" name="drone" value="2">
    <label for="dewey">Negative</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="3">
    <label for="louie">Neutral</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="0">
    <label for="louie">All</label>
  </div>
  </form>
  `
  div.querySelector('form').addEventListener('change', (e) => {
    console.log(e.target.value)
    graph.setState({sentimentFilter: + e.target.value})
  })


  div.appendChild(canvas)
  return div
};


export const sourceFilter = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({flatSize: true})
  graph.setState({color: 'sentiment'})


  let div = document.createElement('div')
  div.innerHTML = `<form>
  <div>
    <input type="radio" id="huey" name="drone" value="thecut"
           checked>
    <label for="huey">thecut</label>
  </div>

  <div>
    <input type="radio" id="dewey" name="drone" value="amazon">
    <label for="dewey">amazon</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="all">
    <label for="louie">all</label>
  </div>

  </form>
  `
  div.querySelector('form').addEventListener('change', (e) => {

    graph.setState({sourceFilter: e.target.value})
  })


  div.appendChild(canvas)
  return div
};
