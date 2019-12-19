let _ = require('underscore')

let edges = require('./edges')

let data = _.range(100).map(() => {
  return [
    (Math.random() - .5 ) * 2, (Math.random() - .5) * 2]
})

let c = [
  './data/eastwestcommute.json',
  './data/philippines.json',
  './data/sfcommute.json',
  './data/world.json'
]

fetch(c[c.length - 2])
  .then((body)=>{ return body.json() })
  .then((json)=>{
    init(json.map(
      (d) => { return d.data.coords.map((d, i) => { return 2* d / (i % 2 ? innerHeight: innerWidth) - 1.})
             })
        )
  })

window.d = data

let init = (data) => {
  let width = innerWidth, height = innerHeight
  window.data = data
  return edges(data, {
    width: width,
    height: height,
    root: document.querySelector('body')
  })
}
