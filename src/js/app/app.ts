import { InboxSDKInstance } from "inboxsdk"
import settings from "../settings"
// @ts-ignore
import Tribute from 'tributejs/src/Tribute'
import mergeModalContent from "./components/mail-merge";
import { requestHeaders, Base64EncodeUrl, addClass, createElement, addCss, waitForElement } from "./components/utils";
import mailMerge from "./components/mail-merge";
import { defaultTokens, defaultTokenData, replaceTokens } from "./components/tokens"
import { ICheckAuthResponse } from '../components/messages';
import { sendCampaign, ICampaignResult } from './components/email';
import {
  createCampaign,
  getUnsubEmails,
  updateCampaign,
  getCampaignReport,
  getAllCampaigns as getAllCampaignsServer,
  getUserInfo
} from "./components/server";
import { createCampaign as dbCreateCampaign, getCampaignFromReport, getAllCampaigns } from './components/db'
import { createReportEmail, createReportHTML, updateCampaigns, getMissingLabels, createLabel } from "./components/reports";
require('tributejs/dist/tribute.css')
require('../../css/style.scss')

let ixSdk: InboxSDKInstance
let userId: string
let googleToken: string

export default function app(sdk: InboxSDKInstance, gmailAuth: ICheckAuthResponse, auth: IAuth0) {
  ixSdk = sdk
  googleToken = gmailAuth.token
  userId = gmailAuth.userId
  // check if labels have been created
  getMissingLabels(settings.labels, googleToken).then((missingLabelKeys) => {
    console.log(missingLabelKeys)
    console.log(settings.labels)
    missingLabelKeys.forEach(async (key) => {
      const r = await createLabel(settings.labels[key], googleToken)
      settings.labels[key].id = r.id
    })
  }).catch((err) => {
    console.log(err)
  })
  // make sure local campaigns are synced
  getAllCampaignsServer({
    userId
  }).then(async (res) => {
    console.log(res)
    const currentCampaigns = await getAllCampaigns()
    const currentCampaignIds = currentCampaigns.map((c) => c.campaignId)
    res.campaigns.forEach(async (camp) => {
      if (currentCampaignIds.indexOf(camp.id) === -1) {
        await dbCreateCampaign({
          id: camp.id,
          sentThreadIds: camp.sentThreadIds,
          reportMessageId: camp.reportMessageId
        })
      }
    })
  }).catch((err) => {
    console.log(err)
  })
  // update current campaigns, check historyId
  updateCampaigns(userId, googleToken)
  // update every 2 minutes
  setInterval(() => {
    updateCampaigns(userId, googleToken)
  }, 120000)

  // add merge button next to search bar
  waitForElement('#aso_search_form_anchor', (el) => {
    if (el) {
      mailMerge(sdk, googleToken)
    } else {
      window.location.reload()
    }
  })

  // on message view - for loading reports
  sdk.Conversations.registerMessageViewHandler(async (messageView) => {
    try {
      const id = await messageView.getMessageIDAsync()
      const campaign = await getCampaignFromReport(id)
      if (campaign.docs.length > 0) {
        const report = await getCampaignReport({
          campaignId: campaign.docs[0].campaignId,
          userId
        })
        const messageEl = messageView.getBodyElement()
        messageEl.innerText = ''
        const messageContent = createReportHTML({
          report
        })
        messageEl.appendChild(messageContent)
      }
    } catch (e) {
      console.log(e)
    }
  })

  // composeView buttons
  sdk.Compose.registerComposeViewHandler((composeView) => {
    addAutocomplete(composeView)
    composeView.addButton({
      iconClass: 'sendia-send-test',
      title: 'Send Test',
      type: 'SEND_ACTION',
      onClick() {
        const modal = ixSdk.Widgets.showModalView({
          el: testEmailContent(sdk.User.getEmailAddress(), (emailAddress) => {
            modal.close()
            sendCampaign({
              campaignId: 'test',
              composeView,
              googleToken,
              unSubEmails: [],
              inboxSDK: ixSdk,
              testEmail: emailAddress,
              unSubLink: `${settings.host}/unsubscribe/test`,
              userEmail: sdk.User.getEmailAddress(),
              userType: auth.isLoggedIn && auth.activeSubscription ? 'paid' : 'free'
            }, () => {
              //
            })
          }),
          title: 'Send Test Email'
        })
      }
    })
    composeView.addButton({
      iconClass: 'sendia-send',
      title: 'Send',
      type: 'SEND_ACTION',
      onClick: async () => {
        try {
          const userInfo = await getUserInfo({ userId })
          const el = emailsRemainingModalEl({
            auth,
            emailCount: composeView.getToRecipients().length,
            userInfo
          }, async () => {
            modal.close()
            composeView.close()
            const newCampaign = await createCampaign({ userId })
            sendCampaign({
              campaignId: newCampaign.campaignId,
              composeView,
              googleToken,
              inboxSDK: ixSdk,
              userEmail: sdk.User.getEmailAddress(),
              unSubEmails: userInfo.emails,
              unSubLink: newCampaign.unsubLink,
              userType: auth.isLoggedIn && auth.activeSubscription ? 'paid' : 'free'
            }, async (err, campaignRes: ICampaignResult) => {
              if (err) {
                return console.log(err)
              }
              try {
                const report = await createReportEmail(googleToken, campaignRes.reportTitle)
                await dbCreateCampaign({
                  id: newCampaign.campaignId,
                  reportMessageId: report.id,
                  sentThreadIds: campaignRes.sentThreadIds
                })
                const updateRes = await updateCampaign({
                  campaignId: newCampaign.campaignId,
                  userId,
                  reportMessageId: report.id,
                  sentThreadIds: campaignRes.sentThreadIds,
                  failedMessages: campaignRes.failedEmails,
                  sentMessages: campaignRes.sentEmails
                })
              } catch (e) {
                console.log('Campaign update failed.', e)
              }
            })
          }, () => {
            return modal.destroyed
          })
          const modal = ixSdk.Widgets.showModalView({
            el,
            title: 'Your Account...'
          })
        } catch (e) {
          console.log('Campaign creation failed.', e)
        }
      }
    })
    document.querySelectorAll('.sendia-send, .sendia-send-test').forEach((el) => {
      el.parentElement.classList.add('sendia-btn')
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
      <input style="flex-grow: 1" type="text" class="sendia-input" 
      placeholder="Email address" value="${defaultEmail}" />
      <div class="inboxsdk__compose_sendButton sendia-btn">Send</div>
    </div>
  `
  const input = div.querySelector('input')
  const btn = div.querySelector('.sendia-btn')
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

interface IEmailsRemainingOpts {
  userInfo: AppResponse.IUserInfo,
  emailCount: number,
  auth: IAuth0
}

function emailsRemainingModalEl(
  opts: IEmailsRemainingOpts,
  onSend: () => void,
  isModalDestroyed: () => boolean
) {
  const { auth, userInfo } = opts
  const div = document.createElement('div')
  const initAuth = Object.assign({}, auth)

  function create() {
    const fc = div.firstChild
    if (fc !== null) {
      fc.remove()
    }
    const d = document.createElement('div')
    const sent = userInfo.emailsSentToday
    // set the limits for free/paid users
    const limit = auth.activeSubscription ? userInfo.limits.paid : userInfo.limits.free
    const remaining = limit - sent

    if (remaining <= 0) {
      d.innerHTML = `
        <p>Limit reached! You have hit the limit of <b>${limit}</b> emails per day, please wait until tomorrow to send more.</p>
        <p>You can increase your daily send limit by signing up for our <a href="#">premium plan.</a></p>
      `
      return
    } else {
      const cantBeSent = opts.emailCount - remaining
      const cantBeSentMsg = `<p>Only <b>${remaining}</b> emails from a total of <b>${opts.emailCount}</b> will be sent from this campaign.</p>`
      const usageMsg = `<p>This campaign will send <b>${opts.emailCount}</b> emails.</p>`
      d.innerHTML = `
        <p>You have sent <b>${sent}</b> emails today with <b>${remaining}</b> remaining.</p>
        ${opts.emailCount > remaining ? cantBeSentMsg : usageMsg}
      `
    }
    if (!auth.isLoggedIn && !auth.activeSubscription) {
      d.innerHTML += `
        <p>You are not logged in. If you are a subscriber, please log into your account by clicking the extension icon.</p>
      `
    } else if (!auth.activeSubscription) {
      d.innerHTML += `
        <p>You are logged in but don't have an active subscription! <a href="#">Click here to resubscribe.</a></p>
      `
    }
    // add send campaign button
    if (remaining > 0) {
      d.innerHTML += `<div id="send-btn" class="sendia-btn inboxsdk__compose_sendButton">Send campaign</div>`
      const button = d.querySelector('#send-btn')
      button.addEventListener('click', onSend)
    }
    div.appendChild(d)
  }

  // if the auth object is updated rebuild the html
  const int = setInterval(() => {
    if (isModalDestroyed()) {
      clearInterval(int)
    }
    if (initAuth.activeSubscription !== auth.activeSubscription || initAuth.isLoggedIn !== initAuth.isLoggedIn) {
      create()
      clearInterval(int)
    }
  }, 500)

  create()
  return div
}
