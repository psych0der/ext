export function getToken(cb: (token: string, err: any) => void) {
  chrome.identity.getAuthToken({}, (token) => {
    if (!token) {
      cb(null, 'Access has not been granted.')
    } else {
      cb(token, null)
    }
  })
}

export function auth(cb: (token: string, err?: any) => void) {
  const r = chrome.identity.getAuthToken({ interactive: true }, (newToken) => {
    if (!newToken) {
      cb(null, 'Sign in failed.')
    } else {
      cb(newToken, null)
    }
  })
}
