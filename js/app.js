// const fetch = require('node-fetch')
function curry( fn ) {
  return (function resolver() {
    var memory = Array.prototype.slice.call( arguments )
    return function() {
      var local = memory.slice(), next
      Array.prototype.push.apply( local, arguments )
      next = local.length >= fn.length ? fn : resolver
      return next.apply( null, local )
    }
  }())
}
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x)
const map = fn => coll => Array.prototype.map.call(coll, fn)
const join = init => data => Array.prototype.join.call(data, init)
const toStr = join('')

const httpGetUsers = (url,howmany) => {
  const res = fetch(url+"/?results=" + String(howmany))
  return res
    .then(data=> (data.status === 200)
      ? data.json().then(json=>json.results)
      : null
    )
    .catch(err=>{
      console.log("Status: "+ err.message)
      throw new Error(err.message.toLowerCase())
    })
}

const app = (prom, targetId) => {

  const nameTemplate = v => {
    return (`
    <tr class="user">
      <td class="img"><img src="${v.picture.thumbnail}" alt="user-thumbnail"></td>
      <td class="title">${v.name.title}</td>
      <td class="fname">${v.name.first}</td>
      <td class="last">${v.name.last}</td>
    </tr>`)
  }

  const moreDataTemplate = v => {
    return (`
    <tr class="user">
      <td class="img"><img src="${v.picture.thumbnail}" alt="user-thumbnail"></td>
      <td class="title">${v.name.title}</td>
      <td class="fname">${v.name.first}</td>
      <td class="last">${v.name.last}</td>
      <td class="email">${v.email}</td>
      <td class="dob">${v.dob}</td>
    </tr>`)
  }

  
  const generateDomString = (templateFn, prom) => {
    return prom.then(ary => {
      // pass on a Promise containing a dom string
      // :: [] -> Promise(String)
      return pipe(
        templateFn,
        toStr
      )(ary)
    })
  }
  const cGenerateDomString = curry(generateDomString)
  
  const makeBtnClickHandler = (listen, prom, template) => {
    document.getElementById(listen).addEventListener('click', ()=>{
      cGenerateDomString(template, prom).then(data => {
        targetId.innerHTML = data
      })
    })
    // * Important to return the promise.
    return prom
  }
  
  const mapNameTemplate = map(nameTemplate)
  const mapMoreTemplate = map(moreDataTemplate)
  const domStringName = cGenerateDomString(mapNameTemplate)

  // Show basic template when app initializes.
  domStringName(prom).then(ds => targ.innerHTML = ds)

  // generate views depending on button click.
  makeBtnClickHandler('names', prom, mapNameTemplate) && makeBtnClickHandler('more', prom, mapMoreTemplate)
    .catch(err => {
      console.log(err.message)
      targetId.innerHTML = `<span class="error">Something went wrong: ${err.message}</span>`
    })

}

const prom = httpGetUsers('https://randomuser.me/api', 20)
const targ = document.getElementById('app')
app(prom, targ)
