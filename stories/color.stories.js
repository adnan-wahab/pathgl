
export default { title: 'Color Tests' };
import createGraphOnce from './singleton'


export const sentimentColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'sentiment'})
  return canvas
};


export const louvainColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'louvain'})
  return canvas
};

export const greedyColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'greedy'})
  return canvas
};


export const randomColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'random'})
  return canvas

};
