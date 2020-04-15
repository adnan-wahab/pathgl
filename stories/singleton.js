import GraphRenderer from '../src';
import _ from 'lodash'
import mbJSON from './public/mobile-banking.json';

let init = _.once(function () {
  let canvas = document.createElement('canvas')


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
