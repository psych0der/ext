import { auth, getToken } from "./components/auth"
import * as notifs from "./components/notifications"
import { ICheckAuth, Type, IGmailSignIn } from "./components/messages"

const m: ICheckAuth = {
  type: Type.CHECK_AUTH
}
chrome.runtime.sendMessage(m, (token: string | null) => {
  console.log(token)
  if (!token) {
    const m: IGmailSignIn = {
      type: Type.GMAIL_SIGN_IN
    }
    chrome.runtime.sendMessage(m)
  } else {
    // run content
  }
})
