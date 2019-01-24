import { ICheckAuth, Type, IGmailSignIn, ICheckAuthResponse, IClearToken, ITypes, IAuth0UpdateResult } from "./components/messages"
import settings from './settings'
import app from './app/app'
import { open, destroy } from "./app/components/db"
import { checkSubscription } from "./app/components/server";
import { InboxSDKInstance } from "inboxsdk"
const jwtDecode = require('jwt-decode')

declare global {
  interface Window {
    Auth0Lock: Auth0LockStatic
  }
}

const lock = new window.Auth0Lock(
  'fyC5bVRJv30lSmkDKSYw2wwADXQkIwlp',
  'sendiateam.auth0.com',
  {
    allowSignUp: false,
    autoclose: true,
    auth: {
      redirect: false,
      responseType: 'token id_token',
      params: {
        scope: 'openid offline_access email',
      }
    }
  }
)

lock.on('authenticated', async (authResult) => {
  console.log(authResult)
  const decode = jwtDecode(authResult.idToken)
  const m: IAuth0UpdateResult = {
    type: Type.AUTH0_UPDATE_RESULT,
    result: {
      access_token: authResult.accessToken,
      id_token: authResult.idToken,
      email: decode.email
    }
  }
  chrome.runtime.sendMessage(m)
  auth0.isLoggedIn = true
  auth0.auth0Token = authResult.accessToken
  try {
    const r = await checkSubscription({
      accessToken: authResult.accessToken
    })
    auth0.activeSubscription = r.active
  } catch (e) {
    console.log(e)
  }
})

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
      auth0.activeSubscription = r.active
    } catch (e) {
      console.log(e)
    }
  } else if (message.type === Type.AUTH0_SIGN_OUT) {
    auth0.isLoggedIn = false
    auth0.activeSubscription = false
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
  } else {
    // lock.show()
  }
})

// @ts-ignore
InboxSDK.load(1, settings.inboxSDK).then(prepareApp).catch((err) => {
  console.log(err)
})

async function prepareApp(sdk: InboxSDKInstance) {
  // open the database
  await open()
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
        createGmailSignInModal(sdk, clearToken(res.token))
      } else {
        // check if this email(using google token, NOT the auth0 token) has an active subscription.
        // if not, the user will need to login with their auth0 account
        console.log('checking sub')
        checkSubscription({
          accessToken: res.token,
          isGoogleToken: true
        }).then((res) => {
          auth0.activeSubscription = res.active
        }).catch((err) => {
          console.log(err)
        })
        console.log('running app')
        app(sdk, res, auth0, lock)
      }
    }
  })
}

function createGmailSignInModal(sdk: InboxSDKInstance, onClearToken?: (onComplete: () => void ) => void) {
  const el = document.createElement('div')
  const email = sdk.User.getEmailAddress()
  el.innerHTML = `
    <div>To start sending emails, ${settings.extensionName} needs access to the Gmail account <b>${email}</b></div>
    <br />
    <div id="send-btn" class="sendia-btn inboxsdk__compose_sendButton">Sign in</div>
  `
  const btn = el.querySelector('#send-btn') as HTMLElement
  btn.addEventListener('click', () => {
    btn.innerText = 'Loading...'
    const onComplete = () => {
      console.log('signed in')
      modal.close()
      prepareApp(sdk)
      if (!auth0.isLoggedIn && !auth0.activeSubscription) {
        lock.show()
      }
    }
    const signInMsg: IGmailSignIn = {
      type: Type.GMAIL_SIGN_IN
    }
    if (onClearToken) {
      onClearToken(() => {
        chrome.runtime.sendMessage(signInMsg, onComplete)
      })
    } else {
      chrome.runtime.sendMessage(signInMsg, onComplete)
    }
  }, {
      once: true
    })
  const modal = sdk.Widgets.showModalView({
    el,
    title: 'Sendia - Gmail Access Required'
  })
}

function clearToken(token: string) {
  return (onComplete: () => void) => {
    const msg: IClearToken = {
      token,
      type: Type.CLEAR_TOKEN
    }
    chrome.runtime.sendMessage(msg, onComplete)
  }
}
