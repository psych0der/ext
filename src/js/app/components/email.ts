import settings from '../../settings'
import { queue } from 'async'
import { defaultTokens, defaultTokenData, replaceTokens } from "./tokens"
import { Base64EncodeUrl, requestHeaders } from './utils';
import { InboxSDKInstance } from 'inboxsdk';

interface ISendCampaignOptions {
  googleToken: string,
  composeView: InboxSDK.Compose.ComposeView,
  inboxSDK: InboxSDKInstance,
  userEmail: string,
  testEmail?: string,
  campaignId: string,
  unSubLink: string,
  unSubEmails: string[],
  userType: TUserType
}

type TUserType = 'paid' | 'free'

export interface ICampaignResult {
  sentEmails: string[],
  sentThreadIds: string[],
  failedEmails: string[],
  reportTitle: string
}

export async function sendCampaign(opts: ISendCampaignOptions, onComplete: (err: any, res: ICampaignResult) => void) {
  console.log('sending campaign')
  const subject = opts.composeView.getSubject()
  const message = opts.composeView.getHTMLContent()
  const recepients = opts.composeView.getToRecipients()
  const errors: string[] = []
  const q = queue(sendEmail, 2)
  let skipCount = 0
  let sendCount = 0
  const saveText = document.createElement('span')
  saveText.innerText = 'Sending emails...'
  const saveMsg = opts.inboxSDK.ButterBar.showSaving({
    confirmationText: 'All emails sent!',
    el: saveText,
  })
  const campaignResult: ICampaignResult = {
    failedEmails: [],
    reportTitle: subject,
    sentEmails: [],
    sentThreadIds: [],
  }
  q.drain = () => {
    // @ts-ignore
    saveMsg.resolve()
    if (errors.length > 0) {
      opts.inboxSDK.ButterBar.showError({
        html: `
        <p>${errors.length} ${errors.length === 1 ? 'error' : 'errors'} occurred.</p>
        ${errors.map((e) => {
            return `<p>${e}</p>`
          }).join('\n')}
        `,
        persistent: true
      })
    }
    onComplete(null, campaignResult)
  }

  for (let index = 0; index < recepients.length; index++) {
    // add placeholders to message and subject
    const rec = recepients[index]
    let tokenData: any
    let msg: string
    let sbjct: string
    const name = rec.name === null ? '' : rec.name

    // check if email is in unsubscribe list
    if (opts.unSubEmails.indexOf(rec.emailAddress) !== -1) {
      errors.push(`${rec.emailAddress} was skipped.`)
      skipCount++
      continue
    }
    // @ts-ignore
    if (opts.composeView.customData !== undefined) {
      // use custom data
      // @ts-ignore
      tokenData = opts.composeView.customTokenData(index)
    } else {
      tokenData = defaultTokenData(rec.emailAddress, name)
    }
    sbjct = replaceTokens(tokenData, subject)
    msg = replaceTokens(tokenData, message)

    q.push({
      googleToken: opts.googleToken,
      message: msg,
      recepient: opts.testEmail ? opts.testEmail : rec.emailAddress,
      subject: sbjct,
      userEmail: opts.userEmail,
      unSubLink: `${opts.unSubLink}${rec.emailAddress}`,
      imgLink: `${settings.host}/campaign/open?campaignId=${opts.campaignId}&email=${rec.emailAddress}`,
      userType: opts.userType
    }, (err: any, res: any) => {
      if (err) {
        errors.push(err.message)
        campaignResult.failedEmails.push(err.email)
      } else {
        campaignResult.sentEmails.push(res.email)
        campaignResult.sentThreadIds.push(res.threadId)
      }
      sendCount++
      saveText.innerText = `Sent ${sendCount}/${recepients.length} emails.`
      console.log('email sent', res)
    })
    // this is a send test so we should break the loop
    if (opts.testEmail) {
      break
    }
  }
  // if all emails are skipped we still need to trigger the queue complete
  console.log(recepients.length, skipCount)
  if (recepients.length === skipCount) {
    q.drain()
  }
}

interface ISendEmailOptions {
  subject: string,
  message: string,
  recepient: string,
  userEmail: string,
  googleToken: string,
  userType: TUserType,
  unSubLink?: string,
  imgLink?: string
}

export function sendEmail(options: ISendEmailOptions, cb: (err: null | any, res?: any) => void) {
  const message = createMessage({
    from: options.userEmail,
    message: options.message,
    recepient: options.recepient,
    subject: options.subject,
    unSubLink: options.unSubLink,
    imgLink: options.imgLink,
    adLink: options.userType === 'free' ? true : false
  })
  const body = {
    raw: message
  }
  fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/send?key=${settings.googleApiKey}`, {
    body: JSON.stringify(body),
    headers: requestHeaders(options.googleToken),
    method: 'POST'
  }).then((res) => {
    return res.json()
  }).then((res) => {
    res.email = options.recepient
    if (res.error) {
      throw res.error
    }
    cb(null, res)
  }).catch((err) => {
    err.email = options.recepient
    console.log(err)
    cb(err)
  })
}

interface IMessageOptions {
  message: string,
  subject: string,
  from: string,
  unSubLink?: string,
  imgLink?: string,
  recepient?: string,
  adLink?: boolean
}

export function createMessage(options: IMessageOptions) {
  const messageContents = [
    'Content-Type: text/html; charset="UTF-8";\r\n',
    'MIME-Version: 1.0\r\n',
    `to: ${options.recepient}\r\n`,
    `from: ${options.from}\r\n`,
    `subject: ${options.subject}\r\n\r\n`,
    `${options.message}\r\n`,
  ]
  if (options.unSubLink) {
    messageContents.push(
      `<div style="margin-top:50px;">Don't want to receive any more emails? <a href="${options.unSubLink}">Click here to unsubscribe.</a></div>\r\n`
    )
  }
  if (options.adLink) {
    messageContents.push(
      `<div style="margin-top:10px">This email was sent using <a href="${settings.host}">GMC</a>.</div>\r\n`
    )
  }
  if (options.imgLink) {
    messageContents.push(
      `<img style="display: none;" src="${options.imgLink}" />\r\n`
    )
  }
  const message = messageContents.join('')
  return Base64EncodeUrl(btoa(unescape(encodeURIComponent(message))))
}
