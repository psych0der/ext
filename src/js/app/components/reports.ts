/// <reference path="../../../../../server/types/index.d.ts" />
import settings from '../../settings'
import { requestHeaders } from './utils';
import { sendEmail, createMessage } from './email'
import { getHistoryId, updateHistoryId, updateCampaign } from './server'
import { getAllCampaigns } from './db';

export async function createReportEmail(googleToken: string, reportTitle: string) {
  const message = createMessage({
    from: `Sendia <${settings.contactEmail}>`,
    message: 'Loading email campaign report...',
    recepient: '',
    subject: reportTitle
  })
  const body = {
    raw: message,
    labelIds: [settings.labels.reports.id, "UNREAD"]
  }
  return await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/import?key=${settings.googleApiKey}`, {
    method: 'POST',
    headers: requestHeaders(googleToken),
    body: JSON.stringify(body)
  }).then((res) => {
    return res.json()
  })
}

export async function createFirstTimeEmail(googleToken: string) {
  const message = createMessage({
    from: `Sendia <${settings.contactEmail}>`,
    message: `
    <html>
    <head>
    <style>
      .ol {
        padding-left: 20px;
      }
    </style>
    </head>
    <body>
    <p>Welcome to Sendia!</p>

    <p>To get started, you only need to know 4 things:</p>

    <ol class="ol">
    <li>Have your list of contacts in a Google Sheet (which should have an Email column).</li>
    <li>Click the "New Sendia Campaign" button above.</li>
    <li>Activate personalization fields with the left bracket { character.</li>
    <li>Send your email by clicking the "send with Sendia" button (NOT the traditional Send button).</li>
    </ol>
    <p>If you have any questions, feel free to reply directly to this email.</p>

    Thanks!<br />
    The Team @ Sendia
    </body>
    </html>
    `,
    recepient: '',
    subject: 'Welcome to Sendia'
  })
  const body = {
    raw: message,
    labelIds: ["INBOX", "UNREAD"]
  }
  return await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/import?key=${settings.googleApiKey}`, {
    method: 'POST',
    headers: requestHeaders(googleToken),
    body: JSON.stringify(body)
  }).then((res) => {
    return res.json()
  })
}

export async function getCampaignList(userId: string) {
}

export async function updateCampaigns(userId: string, googleToken: string) {
  try {
    const h = await getHistoryId({
      userId
    })
    const historyId = h.historyId
    if (historyId === null) {
      // get the latest historyId and send it to the server
      const l = await getLatestHistoryId(googleToken)
      const latestHistoryId = l.historyId
      await updateHistoryId({
        historyId: latestHistoryId,
        userId
      })
    } else {
      // using the last saved historyId get all messages and cross reference
      // with existing campaign ThreadIds
      const res = await getHistory(historyId, googleToken)
      if (res.history !== undefined) {
        const currentCampaigns = await getAllCampaigns()
        const newMessages = getNewThreadIds(res)
        const campaignsToUpdate: AppRequest.IUpdateCampaign[] = []

        // update replies of matched threadIds
        newMessages.forEach((msgId) => {
          currentCampaigns.forEach((campaign) => {
            campaign.sentThreadIds.forEach((campMsgId) => {
              if (campMsgId === msgId) {
                campaignsToUpdate.push({
                  campaignId: campaign.campaignId,
                  userId,
                  replies: 1
                })
              }
            })
          })
        })
        const requests = campaignsToUpdate.map((body) => {
          return updateCampaign(body)
        })
        await Promise.all(requests)
      }
      // update the latest historyId
      await updateHistoryId({
        historyId: res.historyId,
        userId
      })
    }
  } catch (err) {
    console.log('Failed to update campaigns', err)
  }
}

function getNewThreadIds(historyRes: IHistoryResponse) {
  const ids: string[] = []
  historyRes.history.forEach((h) => {
    h.messagesAdded.forEach((m) => {
      ids.push(m.message.threadId)
    })
  })
  return ids
}

async function getLatestHistoryId(googleToken: string) {
  return fetch(`https://www.googleapis.com/gmail/v1/users/me/profile?key=${settings.googleApiKey}`, {
    headers: requestHeaders(googleToken)
  }).then((res) => {
    return res.json()
  })
}

interface IHistoryResponse {
  history: Array<{
    messagesAdded: Array<{
      message: {
        threadId: string
      }
    }>
  }>
  historyId: string
}

function getHistory(historyId: string, googleToken: string) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/history?key=${settings.googleApiKey}&historyTypes=messageadded&labelId=UNREAD&startHistoryId=${historyId}`
  return fetch(url, {
    headers: requestHeaders(googleToken)
  }).then((res) => {
    return res.json() as Promise<IHistoryResponse>
  })
}

interface ICreateReportHTML {
  report: AppResponse.ICampaignReport
}

export function createReportHTML(opts: ICreateReportHTML) {
  const div = document.createElement('div')
  div.innerHTML = `
    <table class="sendia-report-table">
      <tbody>
        <tr>
          <td>Sent messages</td>
          <td>${opts.report.sentMessages}</td>
        </tr>
        <tr>
          <td>Failed messages</td>
          <td>${opts.report.failedMessages}</td>
        </tr>
        <tr>
          <td>Opens</td>
          <td>${opts.report.opens}</td>
        </tr>
        <tr>
          <td>Replies</td>
          <td>${opts.report.replies}</td>
        </tr>
        <tr>
          <td>Unsubscribes</td>
          <td>${opts.report.unsubscribes}</td>
        </tr>
      </tbody>
    </table>
  `
  return div
}

interface ILabelListRes {
  labels: Array<{
    id: string,
    name: string
  }>
}

export async function getMissingLabels(labels: ILabels, googleToken: string) {
  const missing: Array<keyof ILabels> = []
  const url = `https://www.googleapis.com/gmail/v1/users/me/labels?key=${settings.googleApiKey}`
  const labelKeys = Object.keys(labels)
  const res = await fetch(url, {
    headers: requestHeaders(googleToken)
  }).then((r) => {
    return r.json() as Promise<ILabelListRes>
  })
  console.log(res)
  labelKeys.forEach((key) => {
    let found = false
    for (const resLabel of res.labels) {
      if (resLabel.name === labels[key].name) {
        labels[key].id = resLabel.id
        console.log(labels[key])
        found = true
        break
      }
    }
    if (!found) {
      missing.push(key)
    }
  })
  console.log(labels)
  return missing
}

export async function createLabel(label: ILabel, googleToken: string) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/labels?key=${settings.googleApiKey}`
  return await fetch(url, {
    headers: requestHeaders(googleToken),
    body: JSON.stringify({
      name: label.name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    }),
    method: 'POST'
  }).then((r) => {
    return r.json()
  })
}
