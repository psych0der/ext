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
  createMergeBtn(() => {
    const content = mergeModalContent((msg) => {
      ixsdk.ButterBar.showError({
        text: msg,
      })
      // modal.close()
    }, () => {
      modal.close()
    })
    const modal = sdk.Widgets.showModalView({
      el: content,
      title: 'Select Spreadsheet',
    })
  })

}

function createMergeBtn(onClick: () => void) {
  const form = document.getElementById('aso_search_form_anchor')
  const p = form.parentElement
  const div = createElement('div')

  p.style.display = 'flex'
  form.style.flexGrow = '1'
  div.classList.add('inboxsdk__compose_sendButton', 'sendia-btn')
  div.style.alignSelf = 'center'
  div.setAttribute('aria-label', 'Select a Spreadsheet')
  div.setAttribute('role', 'button')
  div.setAttribute('data-tooltip', 'Select a Spreadsheet')
  div.innerText = 'Merge'
  div.addEventListener('click', onClick)
  p.appendChild(div)
}

function mergeModalContent(onError: (msg: string) => void, onComposeCreated: () => void) {
  const div = createElement('div')
  const content = createElement('div')
  const load = loader()
  const url = `https://www.googleapis.com/drive/v3/files?key=${settings.googleApiKey}&q=mimeType='application/vnd.google-apps.spreadsheet'`
  fetch(url, {
    headers: requestHeaders(gToken)
  }).then((res) => {
    return res.json()
  }).then((res) => {
    const f = form(res.files, onError, onComposeCreated)
    load.remove()
    div.appendChild(f)
  }).catch((err) => {
    console.log(err)
  })

  content.innerHTML = `
  <p>Select a spreadsheet below to create a new mail campaign.</p>
  <p>The spreadsheet must contain email addresses.</p>`
  div.append(content)
  div.appendChild(load)

  return div
}

function form(files: IFile[], onError: (msg: string) => void, onComposeCreated: () => void) {
  const div = createElement('div')
  const btn = createElement('div')
  const select = createElement('select') as HTMLSelectElement

  div.style.display = 'flex'
  select.innerHTML = `
    ${files.map((f) => {
    return `<option value='${f.id}'>${f.name}</option>`
  }).join()}
  `
  addClass(select, 'merge-select')
  btn.innerText = 'Create'
  btn.addEventListener('click', () => {
    const fileId = select.value
    composeFromSheet(fileId, onError, onComposeCreated)
  })
  addClass(btn, 'sendia-btn')
  addClass(btn, 'inboxsdk__compose_sendButton')
  div.append(select)
  div.append(btn)
  return div
}

function loader() {
  const div = createElement('div')
  div.style.fontWeight = 'bold'
  div.innerText = 'Loading sheets from Google Drive...'
  return div
}

function composeFromSheet(fileId: string, onError: (err: any) => void, onComposeCreated: () => void) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?key=${settings.googleApiKey}&includeGridData=true`
  onComposeCreated()
  ixsdk.ButterBar.showMessage({
    text: 'Creating email from spreadsheet.'
  })
  fetch(url, {
    headers: requestHeaders(gToken),
  }).then((res) => {
    return res.json()
  }).then((res) => {
    const sheet = res.sheets[0]
    const data = sheet.data[0].rowData
    if (data.length < 2) {
      throw new Error('Spreadsheet must contain header and data!')
    }
    const rowData = data.slice(1)
    const header = data[0].values
    const headerTokens = createTokensFromHeader(header)
    const firstRow = data[1].values
    const emailIndex = getEmailIndex(firstRow)
    if (emailIndex === null) {
      throw Error(`Can't find any email addresses! Check your spreadsheet and try again.`)
    }
    const missingCells = missingColumnCells(emailIndex, rowData)
    if (missingCells.length === 1) {
      throw Error(`Row ${missingCells[0]} is missing an email address. Please fix to continue.`)
    } else if(missingCells.length > 1){
      throw Error(`Row ${missingCells.join(', ')} are missing email addresses. Please fix to continue.`)
    }
    return ixsdk.Compose.openNewComposeView().then((composeView) => {
      const placeholders = createAutocompleteVals(header)
      // set tribute collection values to the header names
      // @ts-ignore
      composeView.tribute.collection[0].values = placeholders
      // set custom tokens
      // @ts-ignore
      composeView.tokens = headerTokens
      // @ts-ignore
      composeView.customTokenData = customTokenData(headerTokens, rowData)
      // @ts-ignore
      composeView.customData = rowData
      composeView.setToRecipients(getEmails(emailIndex, rowData))
    })
  }).catch((err) => {
    onError(err.message)
    console.log(err)
  })
}

function getEmails(rowIndex: number, rowData: any[]) {
  return rowData.map((row) => {
    return row.values[rowIndex].formattedValue
  })
}

function missingColumnCells(rowIndex: number, rowData: any[]) {
  const missing = []
  for (let index = 0; index < rowData.length; index++) {
    const row = rowData[index];
    if (!row.values[rowIndex] || !row.values[rowIndex].formattedValue) {
      missing.push(index + 2)
    }
  }
  return missing
}

function getEmailIndex(rowData: any[]) {
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

function createTokensFromHeader(header: any[]) {
  const tokens: any[] = []
  header.forEach((h) => {
    tokens.push(h.formattedValue)
  })
  return tokens
}

function customTokenData(header: string[], rowData: any[]) {
  return (index: number) => {
    const d: any = {}
    console.log(header)
    header.forEach((h, i) => {
      d[h] = rowData[index].values[i].formattedValue
    })
    return d
  }
}
