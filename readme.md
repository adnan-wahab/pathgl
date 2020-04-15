
<p><code>


this.canvasRef = React.createRef();
let graph = createGraphContext()
graph.init(canvasRef.current) //only needed in projectvis page
return <canvas ref={this.canvasRef}>
</code></p>


to use a control
<p><code>createGraphContext().setState({date: [1962, 2011})
</code></p>

<p><code>createGraphContext().setState({search: 'potato' })</code></p>
