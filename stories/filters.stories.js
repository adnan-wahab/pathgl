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
    <input type="date" id='start' value="2020-01-05">
  </label>

  <label>end
    <input type="date" id='end' value="2020-05-05">
  </label>
  `

  div.addEventListener('change', (e) => {
    let start = new Date(div.querySelector('#start').value)
    let end = new Date(div.querySelector('#end').value)

    graph.setNodeVisibility(true, (node) => {
      return start < node.create_time && end > node.create_time;
    })



    // let idx = e.target.id == '#start' ? 0 : 1
    // filter[idx] = + new Date(e.target.value)
    // console.log(filter, e.target.id)
    // graph.setState({dateFilter: filter})
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
    <input type="radio" id="huey" name="drone" value="positive"
           checked>
    <label for="huey">Positive</label>
  </div>

  <div>
    <input type="radio" id="dewey" name="drone" value="negative">
    <label for="dewey">Negative</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="neutral">
    <label for="louie">Neutral</label>
  </div>

  <div>
    <input type="radio" id="louie" name="drone" value="all">
    <label for="louie">All</label>
  </div>
  </form>
  `
  div.querySelector('form').addEventListener('change', (e) => {

    graph.setNodeVisibility(true, (node) => {
      if (e.target.value == 'all') return true

      if (e.target.value == 'neutral') return node.sentiment < .75 && node.sentiment > .25

      if (e.target.value == 'negative') return node.sentiment < .25

      if (e.target.value == 'positive') return node.sentiment > .75

    })

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
    <input type="radio" id="huey" name="drone" value="theCut Dataset"
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
    graph.setNodeVisibility(true, (node) => {
      if (e.target.value == 'all') return true

      return node.source == e.target.value
    })

  })


  div.appendChild(canvas)
  return div
};
