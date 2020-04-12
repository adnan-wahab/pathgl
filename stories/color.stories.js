import GraphRenderer from '../src';
export default { title: 'Color Tests' };
import theCutJSON from './public/test123.json';
import mbJSON from './public/mobile-banking.json';

import processData from './processData';
import * as d3 from 'd3'



let onStyleChange = (graph, selected) => {
  let data = graph.data


  let getNode = (id) => {
    return points[id]
  }
let parseColor = (color) => {
  let c = d3.color(color);
  return [c.r /255 , c.g /255 , c.b /255];
}

  if (selected === 'sentiment') {
    let x = {  color: _.flatten(graph.data.nodes.map(d => {

      if (d.sentiment > 0) return parseColor('green')
      if (d.sentiment === 0) return parseColor('pink')
      if (d.sentiment < 0) return parseColor('red')

    })
  )
  }

    graph.setProps({attributes :x})
    //window.graph._data
    //this.graph.setProps({colors:})
  }
  if (selected === 'sentimentGradient') {
    let x = _.flatten(graph.data.nodes.map(d => {
      let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
      return parseColor(c)
    }))

    graph.setProps({attributes : {  color: x }})
    //window.graph._data
    //this.graph.setProps({colors:})
  }
  if (selected === 'louvain') {
    let x = Object.entries(data.louvain)
    x.map(tup => {
      let {color, nodes} = tup[1]
      nodes.forEach(id => getNode(id).color = parseColor(color))

    })
  graph.setProps({attributes :
  {  color: _.flatten(data.nodes.map(d => d.color))
  }})
  }
  if (selected === 'greedy') {
    let x = Object.entries(data.greedy)
    x.map(tup => {
      let {color, nodes} = tup[1]
      nodes.forEach(id => getNode(id).color = parseColor(color))

    })
  window.graph.setProps({attributes :
  {  color: _.flatten(data.nodes.map(d => d.color))
  }})
  }
  if (selected === 'kmeans') {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        nodes.forEach(id => getNode(id).color = parseColor(color))

      })
    window.graph.setProps({attributes :
    {  color: _.flatten(data.nodes.map(d => d.color))
    }})
    //window.graph._data
    //this.graph.setProps({colors:})
  }

  if (selected === 'random') {
    window.graph.setProps({attributes :
    {  color: window.graph._data.attributes.color.map(d => Math.random())}
    })
    //window.graph._data
    //this.graph.setProps({colors:})
  }
}


export const sentimentColoring = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(theCutJSON)
  let graph = GraphRenderer.init({
    attributes,
    initialState: {
      showLines: false
    },
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })
  graph.data = attributes

  onStyleChange(graph, 'sentiment')
  return canvas
};

export const dateColoring = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(theCutJSON)

  let graph = GraphRenderer.init({
    attributes,
    canvas: canvas,
    initialState: {
      showLines: false
    },
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};

export const defaultColoring = () => {
  let canvas = document.createElement('canvas')

  let attributes = processData(theCutJSON)

  let graph = GraphRenderer.init({
    attributes,
    initialState: {
      showLines: false
    },
    canvas: canvas,
    onClick: (point, idx, events) => {
      graph.setState({favorites})
    }
  })

  return canvas
};
