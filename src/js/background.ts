import { auth, getToken } from './components/auth'
import { isFirstTimeUser } from './components/storage'
import * as notifs from './components/notifications'
import * as messages from './components/messages'
import { requestHeaders } from './app/components/utils'
import { open } from './app/components/db';
import settings from './settings';
import { isLoggedIn, getJwtToken, getAuthResult, setAuthResult } from './components/auth0';
const Auth0 = require('auth0-chrome')

chrome.runtime.onMessage.addListener((message: messages.ITypes, sender, sendResponse) => {
  if (message.type === messages.Type.CHECK_AUTH) {
    getToken((token, err) => {
      console.log(token)
      if (err) {
        sendResponse(null)
      } else {
        fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
          headers: requestHeaders(token, false)
        }).then((res) => {
          return res.json()
        }).then((userInfo) => {
          const m: messages.ICheckAuthResponse = {
            email: userInfo.email,
            token,
            userId: userInfo.id
          }
          sendResponse(m)
        }).catch((e) => {
          console.log(e)
        })
      }
    })
  } else if (message.type === messages.Type.GMAIL_SIGN_IN) {
    // logIn(sender.tab.id)
    auth(function cb(token, err) {
      if (err) {
        notifs.authFailed(() => {
          auth(cb)
        })
      } else {
        sendResponse(true)
      }
    })
  } else if (message.type === messages.Type.CLEAR_TOKEN) {
    console.log(message.token)
    const url = `https://accounts.google.com/o/oauth2/revoke?token=${message.token}`
    fetch(url).then(() => {
      chrome.identity.removeCachedAuthToken({
        token: message.token
      }, () => {
        // logIn(sender.tab.id)
        sendResponse(true)
      })
    }).catch((e) => {
      sendResponse(false)
      console.log(e)
    })
  } else if (message.type === messages.Type.AUTH0_SIGN_IN) {
    // check if existing token is valid
    const token = getJwtToken()
    if (token && isLoggedIn(token)) {
      sendResponse(getAuthResult())
    } else {
      const a = new Auth0(settings.auth0.domain, settings.auth0.clientId).authenticate({
        device: 'chrome-extension',
        scope: 'openid email',
        title: 'Log in'
      }).then((authResult: any) => {
        setAuthResult(authResult)
        notifs.auth0Success()
        chrome.tabs.query({ active: true }, (tab) => {
          const m: messages.IAuth0LoggedIn = {
            type: messages.Type.AUTH0_LOGGED_IN,
            profile: authResult
          }
          chrome.tabs.sendMessage(tab[0].id, m)
        })
        sendResponse(authResult)
      }).catch((e: any) => {
        console.log(e)
        // display notification
      })
    }
  } else if (message.type === messages.Type.AUTH0_GET_PROFILE) {
    const authResult = getAuthResult()
    console.log(authResult)
    if (authResult && isLoggedIn(authResult.id_token)) {
      sendResponse(authResult)
    } else {
      sendResponse(null)
    }
  } else if (message.type === messages.Type.AUTH0_SIGN_OUT) {
    localStorage.clear()
    sendResponse(true)
    chrome.tabs.getSelected((tab) => {
      console.log(tab)
      chrome.tabs.sendMessage(tab.id, message)
    })
  } else if (message.type === messages.Type.AUTH0_UPDATE_RESULT) {
    setAuthResult(message.result)
    sendResponse(true)
  }
  return true
})

/**
 * Displays a notification asking the user to login.
 * If clicked displays Google oauth login flow.
 *
 * @param {number} tabId
 */
function logIn(tabId: number) {
  notifs.notAuthorized(() => {
    auth(function cb(token, err) {
      if (err) {
        notifs.authFailed(() => {
          auth(cb)
        })
      } else {
        chrome.tabs.reload(tabId)
      }
    })
  })
}

/*
isFirstTimeUser((isFirstTime) => {
  if (isFirstTime) {
    getToken((token, err) => {
      if (err) {
        notifs.firstTime(() => {
          auth(function cb(token, err) {
            if (err) {
              notifs.authFailed(() => {
                auth(cb)
              })
            } else {
              notifs.authSuccess()
            }
          })
        })
      }
    })
  }
})

*/
