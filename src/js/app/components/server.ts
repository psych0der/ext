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
  return request<AppResponse.IGetUnSubEmails>(`${settings.host}/unsubscribe/list?userId=${opts.userId}`, 'GET', null)
}

export async function getHistoryId(opts: AppRequest.IAuth) {
  return request<AppResponse.IGetHistoryId>(`${settings.host}/historyId?userId=${opts.userId}`, 'GET', null)
}

export async function updateHistoryId(opts: AppRequest.IUpdateHistoryId) {
  return request(`${settings.host}/historyId`, 'POST', opts)
}

export async function getAllCampaigns(opts: AppRequest.IAuth) {
  return request<AppResponse.ICampaignList>(`${settings.host}/campaigns?userId=${opts.userId}`, 'GET', null)
}

export function request<T>(url: string, method: string, body: any) {
  const s: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  if (body) {
    s.body = JSON.stringify(body)
  }
  return fetch(url, s).then((res) => {
    return res.json() as Promise<T>
  })
}
