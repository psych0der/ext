import { InboxSDKInstance } from "inboxsdk"
import settings from "../settings"
import Tribute from 'tributejs/src/Tribute'

export default function app(sdk: InboxSDKInstance, googleToken: string) {
  // add tribute css
  addCss(require('tributejs/dist/tribute.css').toString())
  sdk.Compose.registerComposeViewHandler((composeView) => {
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
    // @ts-ignore
    t.attach(composeView.getBodyElement().closest('.inboxsdk__compose').querySelector('input[name="subjectbox"]'))
    t.attach(composeView.getBodyElement())
    composeView.addButton({
      title: 'Test',
      type: 'SEND_ACTION',
      onClick() {
        sendEmails(googleToken, composeView, sdk.User.getEmailAddress())
      }
    })
  })
}

function sendEmails(googleToken: string, composeView: InboxSDK.Compose.ComposeView, userEmail: string) {
  const subject = composeView.getSubject()
  const message = composeView.getHTMLContent()
  const recepients = composeView.getToRecipients()
  recepients.forEach((rec) => {
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
    headers: {
      'Authorization': `Bearer ${googleToken}`,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  }).then((res) => {
    return res.json()
  }).then((res) => {
    console.log(res)
  }).catch((err) => {
    console.log(err)
  })
}

function addCss(css: string) {
  const s = document.createElement('style')
  s.innerHTML = css
  document.body.appendChild(s)
}

function Base64EncodeUrl(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}
