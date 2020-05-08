import GraphRenderer from '../src';
import _ from 'lodash'
import mbJSON from './public/thecut.json';
import '@storybook/addon-console';

let init = _.once(function () {
  let canvas = document.createElement('canvas')
  // mbJSON.nodes.forEach(d => {
  //   d.source = Math.random() > .5 ? 'thecut' : 'amazon'
  // })

  let graph = GraphRenderer.init({
    data: mbJSON,
    canvas: canvas,
    width: 500,
    height: 500,

    containerDimensions:{
      bottom: 454.3333435058594,
      height: 404.3333435058594,
      left: 210,
      right: 832,
      top: 50,
      width: 622,
      x: 210,
      y: 50
    },
    initialState: {
      //showLines: false
    },
    onClick: (point, idx, events) => {
      //graph.setState({favorites})
    }
  })


  //graph.setSize(1000, 720)

  return [graph, canvas]

})

export default init
