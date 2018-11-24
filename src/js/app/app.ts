import { InboxSDKInstance } from "inboxsdk"
import settings from "../settings"
import Tribute from 'tributejs/src/Tribute'
import mergeModalContent from "./components/mail-merge";
import { requestHeaders, Base64EncodeUrl, addClass, createElement, addCss } from "./components/utils";
import mailMerge from "./components/mail-merge";
require('tributejs/dist/tribute.css')
require('../../css/style.scss')


export default function app(sdk: InboxSDKInstance, googleToken: string) {
  console.log(googleToken)
  // add tribute css
  setTimeout(() => {
    mailMerge(sdk, googleToken)
  }, 5000)
  sdk.Compose.registerComposeViewHandler((composeView) => {
    addAutocomplete(composeView)
    composeView.addButton({
      title: 'Test',
      type: 'SEND_ACTION',
      onClick() {
        sendEmails(googleToken, composeView, sdk.User.getEmailAddress())
      }
    })
  })
}

function addAutocomplete(composeView: InboxSDK.Compose.ComposeView) {
  const t = new Tribute({
    trigger: '{',
    selectTemplate(item: any) {
      return `{${item.original.value}}`
    },
    values: [
      { key: 'FirstName', value: 'FirstName' },
      { key: 'LastName', value: 'LastName' }
    ]
  })
  // expose tribute on the composeView instance
  // @ts-ignore
  composeView.tribute = t
  // subject
  t.attach(composeView.getBodyElement().closest('.inboxsdk__compose').querySelector('input[name="subjectbox"]'))
  // message content
  t.attach(composeView.getBodyElement())
}

function sendEmails(googleToken: string, composeView: InboxSDK.Compose.ComposeView, userEmail: string) {
  const subject = composeView.getSubject()
  const message = composeView.getHTMLContent()
  const recepients = composeView.getToRecipients()
  recepients.forEach((rec, index) => {
    // add placeholders to message and subject
    sendEmail({
      message,
      recepient: rec,
      subject,
      userEmail,
    }, googleToken)
  })
}

interface ISendEmailOptions {
  subject: string,
  message: string,
  recepient: InboxSDK.Common.Contact,
  userEmail: string
}

function sendEmail(options: ISendEmailOptions, googleToken: string) {
  const message = [
    'Content-Type: text/html; charset="UTF-8";\r\n',
    'MIME-Version: 1.0\r\n',
    `to: ${options.recepient.emailAddress}\r\n`,
    `from: ${options.userEmail}\r\n`,
    `subject: ${options.subject}\r\n\r\n`,
    `${options.message}\r\n`
  ].join('')
  const body = {
    raw: Base64EncodeUrl(btoa(message))
  }
  fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/send?key=${settings.googleApiKey}`, {
    body: JSON.stringify(body),
    headers: requestHeaders(googleToken),
    method: 'POST'
  }).then((res) => {
    return res.json()
  }).then((res) => {
    console.log(res)
  }).catch((err) => {
    console.log(err)
  })
}
