export function getToken(cb: (token: string, err: any) => void) {
  chrome.identity.getAuthToken({
    interactive: false
  }, (token) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message)
      return cb(null, chrome.runtime.lastError.message)
    }
    cb(token, null)
  })
}

export function auth(cb: (token: string, err?: any) => void) {
  const r = chrome.identity.getAuthToken({
    interactive: true
  }, (newToken) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message)
      return cb(null, chrome.runtime.lastError.message)
    }
    cb(newToken, null)
  })
}
