export function createElement(el: string) {
  const e = document.createElement(el)
  e.id = 'gmassclone'
  return e
}

export function addClass(el: HTMLElement, clss: string) {
  el.classList.add(clss)
}

export function addCss(css: string) {
  const s = document.createElement('style')
  s.innerHTML = css
  document.body.appendChild(s)
}

export function Base64EncodeUrl(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

export function requestHeaders(googleToken: string) {
  return {
    'Authorization': `Bearer ${googleToken}`,
    'Content-Type': 'application/json'
  }
}

export function isEmail(str: string){
  const r = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return r.test(str)
}
