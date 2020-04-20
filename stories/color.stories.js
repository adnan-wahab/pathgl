
export default { title: 'Color Tests' };
import createGraphOnce from './singleton'


export const sentimentColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'sentiment'})
  return canvas
};


export const generalClusterColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'general'})
  return canvas
};


export const specificClusterColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'specific'})
  return canvas
};

export const mergeClusterColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'merge'})
  return canvas
};


export const randomColoring = () => {
  let [graph, canvas] = createGraphOnce()

  graph.setState({color: 'random'})
  return canvas

};
