import { ICheckAuth, Type, IGmailSignIn, ICheckAuthResponse, IClearToken, ITypes, } from "./components/messages"
import settings from './settings'
import app from './app/app'
import { open, destroy } from "./app/components/db"
import { checkSubscription } from "./app/components/server";
import { InboxSDKInstance } from "inboxsdk";

const auth0: IAuth0 = {
  activeSubscription: false,
  auth0Token: '',
  isLoggedIn: false
}

chrome.runtime.onMessage.addListener(async (message: ITypes, sender, sendResponse) => {
  if (message.type === Type.AUTH0_LOGGED_IN) {
    auth0.isLoggedIn = true
    auth0.auth0Token = message.profile.access_token
    try {
      const r = await checkSubscription({
        accessToken: message.profile.access_token
      })
      console.log(r)
      auth0.activeSubscription = r.active
    } catch (e) {
      console.log(e)
    }
  }
})

chrome.runtime.sendMessage({
  type: Type.AUTH0_GET_PROFILE
}, async (res: any) => {
  console.log(res)
  if (res) {
    auth0.isLoggedIn = true
    auth0.auth0Token = res.access_token
    try {
      const r = await checkSubscription({
        accessToken: res.access_token
      })
      console.log(r)
      auth0.activeSubscription = r.active
    } catch (e) {
      console.log(e)
    }
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
  chrome.runtime.sendMessage(m, async (res: ICheckAuthResponse | null) => {
    if (!res) {
      /*
      const msg: IGmailSignIn = {
        type: Type.GMAIL_SIGN_IN
      }
      chrome.runtime.sendMessage(msg)
      */
      createGmailSignInModal(sdk)
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
        createGmailSignInModal(sdk)
      } else {
        // check if this email has an active subscription.
        // if not, the user will need to login with their auth0 account
        console.log('checking sub')
        try {
          const r = await checkSubscription({
            accessToken: res.token,
            isGoogleToken: true
          })
          console.log(r)
          if (r.active) {
            auth0.activeSubscription = true
          }
        } catch (e) {
          console.log(e)
        }
        console.log('running app')
        app(sdk, res, auth0)
      }
    }
  })
})

function createGmailSignInModal(sdk: InboxSDKInstance) {
  const el = document.createElement('div')
  el.innerHTML = `
    <div>To start sending emails, ${settings.extensionName} needs access to your Gmail account.</div>
    <br />
    <div id="send-btn" class="sendia-btn inboxsdk__compose_sendButton">Sign in</div>
  `
  const btn = el.querySelector('#send-btn')
  btn.addEventListener('click', () => {
    const msg: IGmailSignIn = {
      type: Type.GMAIL_SIGN_IN
    }
    chrome.runtime.sendMessage(msg)
  }, {
      once: true
    })
  sdk.Widgets.showModalView({
    el,
    title: 'Sendia - Gmail Access Required'
  })
}
