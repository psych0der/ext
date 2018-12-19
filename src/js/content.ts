import { auth, getToken } from "./components/auth"
import * as notifs from "./components/notifications"
import { ICheckAuth, Type, IGmailSignIn, ICheckAuthResponse, IClearToken, } from "./components/messages"
import settings from './settings'
import app from './app/app'
import { requestHeaders } from "./app/components/utils";
import { open, destroy } from "./app/components/db"
import { checkSubscription } from "./app/components/server";

const auth0: IAuth0 = {
  activeSubscription: false,
  auth0Token: '',
  isLoggedIn: false
}

chrome.runtime.sendMessage({
  type: Type.AUTH0_LOGGED_IN
}, async (res: any) => {
  console.log(res)
  if (res) {
    auth0.isLoggedIn = true
    auth0.auth0Token = res.token
  }
  try {
    const r = await checkSubscription({
      accessToken: res.access_token
    })
    console.log(r)
    auth0.activeSubscription = r.active
  } catch (e) {
    console.log(e)
  }
})

// @ts-ignore
InboxSDK.load(1, settings.inboxSDK).then(async (sdk) => {
  // open the database
  await open()
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
})
