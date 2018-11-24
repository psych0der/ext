import settings from '../../settings'
import { requestHeaders, createElement, addClass, isEmail } from './utils'
import { InboxSDKInstance } from 'inboxsdk'

interface IFile {
  id: string,
  name: string
}
let ixsdk: InboxSDKInstance
let gToken: string

export default function mailMerge(sdk: InboxSDKInstance, googleToken: string) {
  ixsdk = sdk
  gToken = googleToken
  const p = document.getElementById('aso_search_form_anchor').parentElement
  const btn = createElement('button')

  p.style.display = 'flex'
  addClass(btn, 'merge-btn')
  btn.innerText = 'Merge'
  btn.addEventListener('click', () => {
    const content = mergeModalContent()
    sdk.Widgets.showModalView({
      el: content,
      title: 'Select Spreadsheet'
    })
  })
  p.appendChild(btn)
}

function mergeModalContent() {
  const div = createElement('div')
  const load = loader()
  const url = `https://www.googleapis.com/drive/v3/files?key=${settings.googleApiKey}&q=mimeType='application/vnd.google-apps.spreadsheet'`
  fetch(url, {
    headers: requestHeaders(gToken)
  }).then((res) => {
    return res.json()
  }).then((res) => {
    const f = form(res.files)
    load.remove()
    div.appendChild(f)
  }).catch((err) => {
    console.log(err)
  })

  div.appendChild(load)

  return div
}

function form(files: IFile[]) {
  const div = createElement('div')
  const btn = createElement('button')
  const select = createElement('select') as HTMLSelectElement

  select.innerHTML = `
    ${files.map((f) => {
      return `<option value='${f.id}'>${f.name}</option>`
    }).join()}
  `
  btn.innerText = 'Create'
  btn.addEventListener('click', () => {
    const fileId = select.value
    composeFromFile(fileId)
  })
  div.append(select)
  div.append(btn)
  return div
}

function loader() {
  const div = createElement('div')
  div.innerText = 'Loading sheets from Google Drive...'
  return div
}

function composeFromFile(fileId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?key=${settings.googleApiKey}&includeGridData=true`
  fetch(url, {
    headers: requestHeaders(gToken),
  }).then((res) => {
    return res.json()
  }).then((res) => {
    const sheet = res.sheets[0]
    const data = sheet.data[0].rowData
    const header = data[0].values
    const firstRow = data[1].values
    const emailIndex = getEmailIndex(firstRow)
    if (emailIndex === null) {
      throw Error(`Can't find any email addresses! Check your spreadsheet and try again.`)
    }
    return ixsdk.Compose.openNewComposeView().then((composeView) => {
      const placeholders = createAutocompleteVals(header)
      // set tribute collection values to the header names
      // @ts-ignore
      composeView.tribute.collection[0].values = placeholders
      composeView.setToRecipients(getEmails(emailIndex, data.splice(1)))
    })
  }).catch((err) => {
    console.log(err)
  })
}

function getEmails(rowIndex: number, rowData: any[]) {
  return rowData.map((row) => {
    return row.values[rowIndex].formattedValue
  })
}

function getEmailIndex(rowData: any[]) {
  console.log(rowData)
  for (let index = 0; index < rowData.length; index++) {
    const element = rowData[index]
    if (isEmail(element.formattedValue)) {
      return index
    }
  }
  return null
}

function createAutocompleteVals(header: any[]) {
  const p: any[] = []
  header.forEach((h) => {
    p.push({
      key: h.formattedValue,
      value: h.formattedValue
    })
  })
  return p
}
