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
import { createCampaign, getUnsubEmails, updateCampaign, getCampaignReport } from "./components/server";
import { createCampaign as dbCreateCampaign, getCampaignFromReport } from './components/db'
import { createReportEmail, createReportHTML, updateCampaigns } from "./components/reports";
require('tributejs/dist/tribute.css')
require('../../css/style.scss')

let ixSdk: InboxSDKInstance
let userId: string
let googleToken: string

export default function app(sdk: InboxSDKInstance, auth: ICheckAuthResponse) {
  ixSdk = sdk
  googleToken = auth.token
  userId = auth.userId
  // update current campaigns, check historyId
  updateCampaigns(userId, googleToken)
  // add tribute css
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
      iconClass: 'gmassclone-send-test',
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
              userEmail: sdk.User.getEmailAddress()
            }, () => {
              //
            })
          }),
          title: 'Send Test Email'
        })
      }
    })
    composeView.addButton({
      iconClass: 'gmassclone-send',
      title: 'Send',
      type: 'SEND_ACTION',
      onClick: async () => {
        try {
          const newCampaign = await createCampaign({ userId })
          const unSubEmails = await getUnsubEmails({ userId })
          console.log(newCampaign, unSubEmails)
          sendCampaign({
            campaignId: newCampaign.campaignId,
            composeView,
            googleToken,
            inboxSDK: ixSdk,
            userEmail: sdk.User.getEmailAddress(),
            unSubEmails: unSubEmails.emails,
            unSubLink: newCampaign.unsubLink
          }, async (err, campaignRes: ICampaignResult) => {
            if (err) {
              return console.log(err)
            }
            const report = await createReportEmail(googleToken, campaignRes.reportTitle)
            await dbCreateCampaign({
              id: newCampaign.campaignId,
              reportMessageId: report.id,
              sentThreadIds: campaignRes.sentThreadIds
            })
            const updateRes = await updateCampaign({
              campaignId: newCampaign.campaignId,
              userId,
              sentThreadIds: campaignRes.sentThreadIds,
              failedMessages: campaignRes.failedEmails,
              sentMessages: campaignRes.sentEmails
            })
          })
        } catch (e) {
          console.log(e)
        }
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
