import { auth, getToken } from './components/auth'
import { isFirstTimeUser } from './components/storage'
import * as notifs from './components/notifications'
import * as messages from './components/messages'

chrome.runtime.onMessage.addListener((message: messages.ITypes, sender, sendResponse) => {
  if (message.type === messages.Type.CHECK_AUTH) {
    getToken((token, err) => {
      if (err) {
        sendResponse(null)
      } else {
        chrome.identity.getProfileUserInfo((userInfo) => {
          console.log(userInfo)
          sendResponse({
            email: userInfo.email,
            userId: userInfo.id
          } as messages.ICheckAuthResponse)
        })
      }
    })
  } else if (message.type === messages.Type.GMAIL_SIGN_IN) {
    notifs.notAuthorized(() => {
      auth(function cb(token, err) {
        if (err) {
          notifs.authFailed(() => {
            auth(cb)
          })
        } else {
          chrome.tabs.reload(sender.tab.id)
        }
      })
    })
  }
  return true
})

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
