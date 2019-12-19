let _ = require('underscore')
let nodes = require('./nodes')

let edges = require('./edges')



let c = [
  './data/eastwestcommute.json',
  './data/philippines.json',
  './data/sfcommute.json',
  './data/world.json'
]
let url = c[3]
console.log('fetching url '+ url)
fetch(url)
  .then((body)=>{ return body.json() })
  .then((json)=>{
    init(json.map(
      (d) => { return d.data.coords.map((d, i) => { return d / (i % 2 ? innerWidth: innerHeight )})
             })
        )
  })



let init = (data) => {
  let width = innerWidth, height = innerHeight

  return edges(data, {
    width: width,
    height: height,
    root: document.querySelector('body')
  })
}
