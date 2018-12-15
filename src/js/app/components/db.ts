import PouchDB = require('pouchdb')
import find = require('pouchdb-find')

PouchDB.plugin(find)

interface IBaseCampaign {
  reportMessageId: string,
  sentMessageIds: string[]
}

interface ICampaignOpts extends IBaseCampaign {
  id: string
}

interface ICampaignDoc extends IBaseCampaign {
  _id: string,
  campaignId: string
}

const DB_NAME = 'gmc'
const DOC_PREFIX = {
  CAMPAIGN: 'CAMPAIGN_'
}
let DB: PouchDB.Database

function getCampaignDocId(campaignId: string) {
  return `${DOC_PREFIX}${campaignId}`
}

export async function open() {
  const db = new PouchDB(DB_NAME)
  await db.createIndex({
    index: {
      fields: ['reportMessageId']
    }
  })
  DB = db
  return db
}

export function destroy() {
  return DB.destroy()
}

export function createCampaign(newCampaign: ICampaignOpts) {
  const newDoc: ICampaignDoc = Object.assign(newCampaign, {
    _id: getCampaignDocId(newCampaign.id),
    campaignId: newCampaign.id
  })
  console.log(DB)
  return DB.put(newDoc)
}

export function getCampaign(campaignId: string) {
  return DB.get<ICampaignDoc>(getCampaignDocId(campaignId))
}

export function getCampaignFromReport(reportMessageId: string) {
  return DB.find({
    fields: ['campaignId'],
    limit: 1,
    selector: {
      reportMessageId
    }
  }) as Promise<PouchDB.Find.FindResponse<{campaignId: string}>>
}
