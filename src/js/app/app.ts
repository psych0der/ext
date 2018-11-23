import { InboxSDKInstance } from "inboxsdk"
import settings from "../settings"
import Tribute from 'tributejs/src/Tribute'
require('../../css/style.scss')

export default function app(sdk: InboxSDKInstance, googleToken: string) {
  // add tribute css
  setTimeout(() => {
    mailMerge(sdk)
  }, 3000)
  addCss(require('tributejs/dist/tribute.css').toString())
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

function mailMerge(sdk: InboxSDKInstance){
  const p = document.getElementById('aso_search_form_anchor').parentElement
  const btn = createElement('button')
  const modal = createElement('div')
  modal.innerText = 'Test content'
  p.style.display = 'flex'
  addClass(btn, 'merge-btn')
  btn.innerText = 'Merge'
  btn.addEventListener('click', () => {
    sdk.Widgets.showModalView({
      el: modal,
      title: 'Test modal'
    })
  })
  p.appendChild(btn)
}

function createModalContent() {
  
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
  // subject
  t.attach(composeView.getBodyElement().closest('.inboxsdk__compose').querySelector('input[name="subjectbox"]'))
  // message content
  t.attach(composeView.getBodyElement())
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

function createElement(el: string){
  const e = document.createElement(el)
  e.id = 'gmassclone'
  return e
}

function addClass(el: HTMLElement, clss: string){
  el.classList.add(clss)
}

function addCss(css: string) {
  const s = document.createElement('style')
  s.innerHTML = css
  document.body.appendChild(s)
}

function Base64EncodeUrl(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}
