import { auth, getToken } from './components/auth'
import { isFirstTimeUser } from './components/storage'
import * as notifs from './components/notifications'
import * as messages from './components/messages'
import { requestHeaders } from './app/components/utils'
import { open } from './app/components/db';

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
    logIn(sender.tab.id)
  } else if (message.type === messages.Type.CLEAR_TOKEN) {
    console.log(message.token)
    const url = `https://accounts.google.com/o/oauth2/revoke?token=${message.token}`
    fetch(url).then(() => {
      chrome.identity.removeCachedAuthToken({
        token: message.token
      }, () => {
        logIn(sender.tab.id)
      })
    }).catch((e) => {
      console.log(e)
    })
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
