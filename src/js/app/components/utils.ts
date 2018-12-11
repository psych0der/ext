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
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '')
}

export function requestHeaders(googleToken: string, contentJson: boolean = true) {
  const headers: any = {
    Authorization: `Bearer ${googleToken}`,
  }
  if (contentJson === undefined || contentJson) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export function isEmail(str: string) {
  const r = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return r.test(str)
}

export function waitForElement(selector: string, cb: (el: Element) => void) {
  const maxTries = 500
  let count = 0
  const int = setInterval(() => {
    count++
    const el = document.querySelector(selector)
    if (el !== null || count > maxTries) {
      clearInterval(int)
      cb(el)
    }
  }, 50)
}
