// /* eslint no-console: 0 */
//
import GraphRenderer from '../src';
import * as d3 from 'd3'

let url = [
  'thecut.json',
  'mobile-banking.json',
  'd.tsv',
  '10samps.json'
]

const clip = (d) => {
return d / 4000
}
// var mouseX = (e.offsetX / canvas.clientWidth)*2-1;
// var mouseY = ((canvas.clientHeight - e.offsetY) / canvas.clientHeight)*2-1;


let canvas = document.createElement('canvas')

let main = () => {
  document.body.appendChild(canvas)

  canvas.height = innerHeight
  canvas.width = innerWidth
  load('data/thecut0.json')

  document.title = 'REGL NETWORK VIS'
}

let preprocessData = (d) => {
  let keys = {}
  d.nodes.forEach((node, id) => {
    node.size = 0
    keys[node.uuid] = id
  })

  d.edges.forEach(d => {
    d.target = keys[d.target]
    d.source = keys[d.source]
  })
  let normalize = (d, i) => {
    d.nodes = d.nodes.map(id => keys[id])
  }

  _.each(d.kmeans, normalize)
  _.each(d.louvain, normalize)
  _.each(d.greedy, normalize)

}


let processData = (data) => {
preprocessData(data)

 let colors = data.nodes.map(d => {
   d.x = clip(d.x)
   d.y = clip(d.y)
   return [Math.random(), Math.random(), Math.random()]
 })

  var accent = d3.scaleOrdinal(d3.schemeAccent);

  let sentimentValue = _.flatten(data.nodes.map((d) => {
    let c = d3.rgb(d3.interpolateSpectral(+ d.attributes ? d.attributes.SentimentVal : Math.random()));
    return [c.r /255 , c.g /255 , c.b /255];
  }));

  let counts = {}
  data.edges.forEach(d => {
    data.nodes[d.target].size += 1
    data.nodes[d.source].size += 1
  })



  let position =
  (data.nodes.map((d, id) => [(d.x), (d.y), d.size, id]))


    let edges = {
      sourcePositions: new Array(data.edges.length * 2).fill(0),
      targetPositions: new Array(data.edges.length * 2).fill(0),
      curves: new Array(data.edges.length * 2).fill(0)
    };
    data.edges.forEach((edge, idx) => {
      let source = data.nodes[edge.source], target = data.nodes[edge.target];

      edges.sourcePositions[idx*2] = (source.x)
      edges.sourcePositions[idx*2+1] = (source.y)
      edges.targetPositions[idx*2] = (target.x)
      edges.targetPositions[idx*2+1] = (target.y)

      edges.curves[idx] = {
        x1: (source.x),
        y1: (source.y),
        x2: (target.x),
        y2: (target.y),
      }
    });

    let edgeColors = new Array(data.edges.length * 3).fill(0);
    if (data.kmeans) {
      let x = Object.entries(data.kmeans)
      x.map(tup => {
        let {color, nodes} = tup[1]
        console.log(color)
        nodes.forEach(id => { data.nodes[id].color = color })
      })
    }

      data.edges.forEach((edge, idx) => {
        //console.log(`%c ${edge.target}`, 'background: green;');
        let color = (data.nodes[edge.source] ? data.nodes[edge.source] : getNode(edge.target)).color
        let c = d3.rgb(color);
        edgeColors[idx*3] = c.r / 255
        edgeColors[idx*3+1] = c.g / 255
        edgeColors[idx*3+2] = c.b / 255
    });

    let dates = data.nodes.map((d, idx) => {
      return d.create_time || (Math.random() * new Date());
    })
    let color = _.flatten(data.nodes.map((d) => {
      let c = d3.color(d.color || 'pink');
      return [c.r /255 , c.g /255 , c.b /255];
    }));

    let legend = Object.entries(data.kmeans || {}).map(d => d[1].color);

    let stateIndex = _.flatten(data.nodes.map((d) => {
      let c = d.color
      return legend.indexOf(c);
    }));

    window.x = {
      nodes: data.nodes,
      position,
      edges,
      edgeColors,
      color,
      dates,
      sentimentValue,
      stateIndex

  }
  return window.x
}

let favorites = []
let load = (url) => {
  if (url.includes('.tsv')) return loadTSV(window.location.tsv)
  fetch(url)
    .then((body)=>{ return body.json() })
    .then((json)=>{
      yay(json)

        window.graph = GraphRenderer.init({
          data: json,
          drawCurves: true,
          canvas: canvas,
          onClick: (point, idx, events) => {
            if (events.shiftKey)favorites = favorites.concat(idx)

            graph.setState({favorites})
          }
        })

    })
}
d3.select(window).on('load', main)

function yay(data) {
  let testdata_prepared = []
  data.nodes.forEach((d, i) => {testdata_prepared[i] = d.text })
  console.log('hi')
  const $input = $('#input')
  const $results = $('#results')
  const testdatakeys = Object.keys(testdata_prepared)
  var testdatakey = 'ue4_filenames'
  var searchMode = 'Ludicrous Mode'
  var cache = {}
  const cacheChars = 'abcdefghijklmnopqrstuvwxyz'
  var promise, cachePromise, cacheCanceled, startms

  cacheNextLevel()

  function getSearchLower() { return $input.val().toLowerCase() }

  function search() {
    $input.focus()
    const inputValue = getSearchLower()

    if(cachePromise) { cachePromise.cancel() }; cacheCanceled = true

    if(searchMode==='Ludicrous Mode') {
      startms = Date.now()
      if(cache[inputValue]) {
        renderCache(cache[inputValue])
        cacheNextLevel()
      } else {
        renderResults(fuzzysort.go(inputValue, testdata_prepared))
        cacheNextLevel()
      }

    } else if(searchMode === 'Async') {
      if(promise) promise.cancel()

      startms = Date.now()
      promise = fuzzysort.goAsync(inputValue, testdata_prepared)
      promise.then(renderResults, err=>console.log(err))

    } else { // Sync
      startms = Date.now()
      renderResults(fuzzysort.go(inputValue, testdata_prepared))
    }
  }

  function cacheNextLevel(nextIndex=0) {
    setTimeout(function() {
      if(nextIndex >= cacheChars.length+testdatakeys.length) return

      const inputValue = getSearchLower()
      var nextInputValue
      var nextdatakey
      if(nextIndex >= cacheChars.length) {
        nextInputValue = inputValue
        nextdatakey = testdatakeys[nextIndex - cacheChars.length]
      } else {
        nextInputValue = inputValue+cacheChars[nextIndex]
        nextdatakey = testdatakey
      }

      const isCached = cache[nextInputValue]
      if(isCached) return cacheNextLevel(nextIndex + 1)

      if(nextIndex===0) cacheCanceled = false
      cachePromise = fuzzysort.goAsync(nextInputValue, testdata_prepared)
      cachePromise.then(results => {
        console.log(results)
        //if(cache[nextdatakey]===undefined) cache[nextdatakey] = {}
        cache[nextInputValue] = {total:results.total, html:resultsToHtml(results)}
        if(!cacheCanceled) cacheNextLevel(nextIndex + 1)
      })
    })
  }

  function resultsToHtml(results) {
    var html = '<ul>'
    for (var i = 0; i < results.length; i++) {
      const result = results[i]
      html += `<li>${result.score} - ${fuzzysort.highlight(result)}</li>`
    }
    html += '</ul>'
    return html
  }
  function renderResults(results) {
    const duration = Date.now() - startms
    const header = `<p>${results.total} matches in ${duration}ms</p>`
    const html = resultsToHtml(results)

    cache[getSearchLower()] = {total:results.total, html}

    $results.html(header+html)
  }
  function renderCache(cached) {
    const duration = Date.now() - startms
    const header = `<p>${cached.total} matches in ${duration}ms <small class="text-muted"><i>cached</i></small></p>`
    $results.html(header+cached.html)
  }

  // Run a search on input change
    $input.on('input', search)
  // Select input when escape pressed
    document.onkeyup = (e) => {
      if(e.keyCode === 27) $input.select()
    }
  // Focus input when any key pressed
    document.onkeydown = (e) => {
      $input.focus()
    }

  $('#async-buttons').html(`
    <div class="btn-group" data-toggle="buttons">
      ${['Async', 'Sync', 'Ludicrous Mode'].map(name => `
        <label class="btn btn-secondary ${name===searchMode?'active':''}">
          <input type="radio" name="searchMode" value="${name}"> ${name}
        </label>
      `).join('')}
    </div>
  `)

}
