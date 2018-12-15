/// <reference path="../../../../../server/types/index.d.ts" />
import settings from "../../settings";

export async function createCampaign(opts: AppRequest.IAuth) {
  return request<AppResponse.INewCampaign>(`${settings.host}/campaign`, 'POST', opts)
}

export async function updateCampaign(opts: AppRequest.IUpdateCampaign) {
  return request<AppResponse.IUpdateCampaign>(`${settings.host}/campaign`, 'PUT', opts)
}

export async function getCampaignReport(opts: AppRequest.ICampaignReport) {
  return request<AppResponse.ICampaignReport>(`${settings.host}/campaign/report`, 'POST', opts)
}

export async function getUnsubEmails(opts: AppRequest.IAuth) {
  return request<AppResponse.IGetUnSubEmails>(`${settings.host}/unsubscribe/list?userId=${opts.userId}`, 'GET', {})
}

export async function getHistoryId(opts: AppRequest.IAuth) {
  return request<AppResponse.IGetHistoryId>(`${settings.host}/historyId?userId=${opts.userId}`, 'GET', {})
}

export async function updateHistoryId(opts: AppRequest.IUpdateHistoryId) {
  return request(`${settings.host}/historyId`, 'POST', opts)
}

export function request<T>(url: string, method: string, body: any) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then((res) => {
    return res.json() as Promise<T>
  })
}
