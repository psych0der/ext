import { queue } from 'async'
import { InboxSDKInstance } from "inboxsdk"
import settings from "../settings"
// @ts-ignore
import Tribute from 'tributejs/src/Tribute'
import mergeModalContent from "./components/mail-merge";
import { requestHeaders, Base64EncodeUrl, addClass, createElement, addCss, waitForElement } from "./components/utils";
import mailMerge from "./components/mail-merge";
import { defaultTokens, defaultTokenData, replaceTokens } from "./components/tokens"
require('tributejs/dist/tribute.css')
require('../../css/style.scss')

let ixSdk: InboxSDKInstance

export default function app(sdk: InboxSDKInstance, googleToken: string) {
  console.log(googleToken)
  ixSdk = sdk
  // add tribute css
  waitForElement('#aso_search_form_anchor', (el) => {
    if (el) {
      mailMerge(sdk, googleToken)
    } else {
      window.location.reload()
    }
  })
  sdk.Compose.registerComposeViewHandler((composeView) => {
    addAutocomplete(composeView)
    composeView.addButton({
      iconClass: 'gmassclone-send-test',
      title: 'Send Test',
      type: 'SEND_ACTION',
      onClick() {
        const modal = ixSdk.Widgets.showModalView({
          el: testEmailContent(sdk.User.getEmailAddress(), (emailAddress) => {
            modal.close()
            sendEmails(googleToken, composeView, sdk.User.getEmailAddress(), emailAddress)
          }),
          title: 'Send Test Email'
        })
      }
    })
    composeView.addButton({
      iconClass: 'gmassclone-send',
      title: 'Send',
      type: 'SEND_ACTION',
      onClick() {
        sendEmails(googleToken, composeView, sdk.User.getEmailAddress())
      }
    })
    document.querySelectorAll('.gmassclone-send, .gmassclone-send-test').forEach((el) => {
      el.parentElement.classList.add('gmassclone-btn')
    })
  })
}

function testEmailContent(defaultEmail: string, onClick: (emailAddress: string) => void) {
  const div = createElement('div')
  div.innerHTML = `
    <div>
      <p>Type an email address below to test your email campaign.</p>
      <p>Make sure you have at least one email address in the "To" field of your email campaign.</p>
      <p>If using a spreadsheet, personalization tokens will use values from the first row.</p>
    </div>
    <div style="display:flex; margin-top: 10px">
      <input style="flex-grow: 1" type="text" class="gmassclone-input" 
      placeholder="Email address" value="${defaultEmail}" />
      <div class="inboxsdk__compose_sendButton gmassclone-btn">Send</div>
    </div>
  `
  const input = div.querySelector('input')
  const btn = div.querySelector('.gmassclone-btn')
  btn.addEventListener('click', () => {
    onClick(input.value)
  })
  return div
}

function addAutocomplete(composeView: InboxSDK.Compose.ComposeView) {
  const t = new Tribute({
    trigger: '{',
    selectTemplate(item: any) {
      return `{${item.original.value}}`
    },
    values: defaultTokens.map((token) => {
      return {
        key: token,
        value: token
      }
    })
  })
  // expose tribute on the composeView instance
  // @ts-ignore
  composeView.tribute = t
  // subject
  t.attach(composeView.getBodyElement().closest('.inboxsdk__compose').querySelector('input[name="subjectbox"]'))
  // message content
  t.attach(composeView.getBodyElement())
}

function sendEmails(
  googleToken: string,
  composeView: InboxSDK.Compose.ComposeView,
  userEmail: string,
  testEmail?: string
) {
  const subject = composeView.getSubject()
  const message = composeView.getHTMLContent()
  const recepients = composeView.getToRecipients()
  const q = queue(sendEmail, 2)
  let sendCount = 0
  const saveText = document.createElement('span')
  saveText.innerText = 'Sending emails...'
  const save = ixSdk.ButterBar.showSaving({
    confirmationText: 'All emails sent!',
    el: saveText,
  })
  q.drain = () => {
    // @ts-ignore
    save.resolve()
  }

  for (let index = 0; index < recepients.length; index++) {
    // add placeholders to message and subject
    const rec = recepients[index]
    let tokenData: any
    let msg: string
    let sbjct: string
    const name = rec.name === null ? '' : rec.name
    // @ts-ignore
    if (composeView.customData !== undefined) {
      // use custom data
      // @ts-ignore
      tokenData = composeView.customTokenData(index)
    } else {
      tokenData = defaultTokenData(rec.emailAddress, name)
    }
    sbjct = replaceTokens(tokenData, subject)
    msg = replaceTokens(tokenData, message)

    q.push({
      googleToken,
      message: msg,
      recepient: testEmail ? testEmail : rec.emailAddress,
      subject: sbjct,
      userEmail,
    }, (res) => {
      sendCount++
      saveText.innerText = `Sent ${sendCount}/${recepients.length} emails.`
      console.log('email sent', res)
    })

    if (testEmail) {
      // this is a send test so we should break the loop
      break
    } else {
      composeView.close()
    }
  }
}

interface ISendEmailOptions {
  subject: string,
  message: string,
  recepient: string,
  userEmail: string,
  googleToken: string
}

function sendEmail(options: ISendEmailOptions, cb: (err: null | any, res?: any) => void) {
  const message = [
    'Content-Type: text/html; charset="UTF-8";\r\n',
    'MIME-Version: 1.0\r\n',
    `to: ${options.recepient}\r\n`,
    `from: ${options.userEmail}\r\n`,
    `subject: ${options.subject}\r\n\r\n`,
    `${options.message}\r\n`
  ].join('')
  const body = {
    raw: Base64EncodeUrl(btoa(unescape(encodeURIComponent(message))))
  }
  fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/send?key=${settings.googleApiKey}`, {
    body: JSON.stringify(body),
    headers: requestHeaders(options.googleToken),
    method: 'POST'
  }).then((res) => {
    return res.json()
  }).then((res) => {
    cb(null, res)
  }).catch((err) => {
    cb(err)
  })
}
