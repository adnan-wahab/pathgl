import GraphRenderer from '../src';
import _ from 'lodash'
import mbJSON from './public/thecut.json';

let init = _.once(function () {
  let canvas = document.createElement('canvas')
  mbJSON.nodes.forEach(d => {
    d.source = Math.random() > .5 ? 'thecut' : 'amazon'
  })

  let graph = GraphRenderer.init({
    data: mbJSON,
    canvas: canvas,
    initialState: {
      showLines: false
    },
    onClick: (point, idx, events) => {
      //graph.setState({favorites})
    }
  })

  return [graph, canvas]

})

export default init
