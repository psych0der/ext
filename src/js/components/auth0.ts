const jwtDecode = require('jwt-decode')

const AUTH_KEY = 'authResult'

export function isLoggedIn(token: string) {
  try {
    if (jwtDecode(token).exp > Date.now() / 1000) {
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

export function signOut() {
  localStorage.setItem(AUTH_KEY, null)
}

export function getAuthResult(): any {
  return JSON.parse(localStorage.getItem('authResult'))
}

export function setAuthResult(authResult: any): any {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authResult))
}

export function getJwtToken(): string {
  const authResult = getAuthResult()
  if (authResult) {
    return authResult.id_token
  } else {
    return null
  }
}
