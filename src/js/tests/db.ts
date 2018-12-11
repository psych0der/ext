import { expect } from 'chai'
import { open, destroy, createCampaign, getCampaign, getCampaignFromReport } from '../app/components/db';

describe('database tests', () => {

  before(async () => {
    await open()
  })
  after(async () => {
    await destroy()
  })

  it('adds a new campaign', async () => {
    const d = {
      id: '4564',
      reportMessageId: 'report1',
      sentMessageIds: ['34534', '6666']
    }
    const res = await createCampaign(d)
    const g = await getCampaign(d.id)
    expect(g.campaignId).to.eql(d.id)
    expect(g.sentMessageIds).to.deep.equal(g.sentMessageIds)
  })

  it('gets new campaign from reportMessageId', async () => {
    const d = {
      id: '123',
      reportMessageId: 'report3',
      sentMessageIds: ['34534', '6666']
    }
    const res = await createCampaign(d)
    const f = await getCampaignFromReport(d.reportMessageId)
    expect(f.docs.length).to.eql(1)
    const r = f.docs[0]
    expect(r).to.have.property('campaignId', d.id)
  })
})
