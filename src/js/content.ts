import { auth, getToken } from "./components/auth"
import * as notifs from "./components/notifications"
import { ICheckAuth, Type, IGmailSignIn } from "./components/messages"
import settings from './settings'
import app from './app/app'
import { requestHeaders } from "./app/components/utils";

const m: ICheckAuth = {
  type: Type.CHECK_AUTH
}
// @ts-ignore
InboxSDK.load(1, settings.inboxSDK).then((sdk) => {
  // your app code using 'sdk' goes in here
  chrome.runtime.sendMessage(m, (token: string | null) => {
    if (!token) {
      const msg: IGmailSignIn = {
        type: Type.GMAIL_SIGN_IN
      }
      chrome.runtime.sendMessage(msg)
    } else {
      app(sdk, token)
    }
  })
});
