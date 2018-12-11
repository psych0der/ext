import { auth, getToken } from "./components/auth"
import * as notifs from "./components/notifications"
import { ICheckAuth, Type, IGmailSignIn, ICheckAuthResponse, IClearToken } from "./components/messages"
import settings from './settings'
import app from './app/app'
import { requestHeaders } from "./app/components/utils";

// @ts-ignore
InboxSDK.load(1, settings.inboxSDK).then((sdk) => {
  // your app code using 'sdk' goes in here
  const m: ICheckAuth = {
    type: Type.CHECK_AUTH
  }
  chrome.runtime.sendMessage(m, (res: ICheckAuthResponse | null) => {
    if (!res) {
      const msg: IGmailSignIn = {
        type: Type.GMAIL_SIGN_IN
      }
      chrome.runtime.sendMessage(msg)
    } else {
      // check if the credentials match the current signed in google account
      // if they don't, clear the token.
      const email = sdk.User.getEmailAddress()
      console.log(res)
      if (email !== res.email) {
        const msg: IClearToken = {
          token: res.token,
          type: Type.CLEAR_TOKEN
        }
        chrome.runtime.sendMessage(msg)
      } else {
        app(sdk, res)
      }
    }
  })
});
