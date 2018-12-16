/// <reference path="../../../../../server/types/index.d.ts" />
import settings from '../../settings'
import { requestHeaders } from './utils';
import { sendEmail, createMessage } from './email'
import { getHistoryId, updateHistoryId, updateCampaign } from './server'
import { getAllCampaigns } from './db';

export async function createReportEmail(googleToken: string, reportTitle: string) {
  const message = createMessage({
    from: settings.contactEmail,
    message: 'Loading email campaign report...',
    recepient: '',
    subject: reportTitle
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
  const h = await getHistoryId({
    userId
  })
  const historyId = h.historyId
  console.log(historyId)
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
    console.log(res)
    if (res.history !== undefined) {
      const currentCampaigns = await getAllCampaigns()
      const newMessages = getNewThreadIds(res)
      const campaignsToUpdate: AppRequest.IUpdateCampaign[] = []
      console.log(currentCampaigns)

      newMessages.forEach((msgId) => {
        currentCampaigns.forEach((campaign) => {
          console.log(campaign)
          campaign.sentThreadIds.forEach((campMsgId) => {
            console.log(campMsgId, msgId)
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
      console.log(campaignsToUpdate)
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
    <table>
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
