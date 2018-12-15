/// <reference path="../../../../../server/types/index.d.ts" />
import settings from '../../settings'
import { requestHeaders } from './utils';
import { sendEmail, createMessage } from './email'
import { getHistoryId, updateHistoryId } from './server'

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
  if (h.historyId === null) {
    // get the latest historyId and send it to the server
    const l = await getLatestHistoryId(googleToken)
    const latestHistoryId = l.historyId
    updateHistoryId({
      historyId: latestHistoryId,
      userId
    })
  } else {
    // using the last saved historyId get all messages and cross reference
    // with existing campaign messageIds
  }
}

async function getLatestHistoryId(googleToken: string) {
  return fetch(`https://www.googleapis.com/gmail/v1/users/me/profile?key=${settings.googleApiKey}`, {
    headers: requestHeaders(googleToken)
  }).then((res) => {
    return res.json()
  })
}

function getHistory(historyId: string, googleToken: string) {
  const url = `https://www.googleapis.com/gmail/v1/users/me/history?key=${settings.googleApiKey}&historyTypes="messageAdded"&labelId="UNREAD"&startHistoryId=${historyId}`
  return fetch(url, {
    headers: requestHeaders(googleToken)
  }).then((res) => {
    return res.json()
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
