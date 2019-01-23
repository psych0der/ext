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
      modal.close()
      ixsdk.ButterBar.showError({
        text: msg,
      })
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

function continueModalContent(missingRows: number[]) {
  console.log(missingRows)
  const div = document.createElement('div')
  // the row numbers are indexed from 0
  // add two to each result to show the correct sheet row number
  const updatedMissingRows = missingRows.map((r) => r + 2)
  const length = updatedMissingRows.length
  if (missingRows.length === 1) {
    div.innerHTML = `<p>Row <b>${updatedMissingRows[0]}</b> is missing an email address.</p>
    <p>Do you want to continue? These rows will be skipped.</p>`
  } else if (missingRows.length > 1) {
    const l = missingRows.length - 1
    const missingStr = `${updatedMissingRows.slice(0, l).join(', ')} and ${updatedMissingRows[length - 1]}`
    div.innerHTML = `<p>Rows <b>${missingStr}</b> are missing email addresses.</p>
    <p>Do you want to continue? These rows will be skipped.</p>`
  }
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

async function composeFromSheet(fileId: string, onError: (err: any) => void, onComposeCreated: () => void) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?key=${settings.googleApiKey}&includeGridData=true`
  ixsdk.ButterBar.showMessage({
    text: 'Checking spreadsheet.'
  })
  try {
    const res = await fetch(url, {
      headers: requestHeaders(gToken),
    }).then((res) => {
      return res.json()
    })
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
    const missingRows = missingEmailRows(emailIndex, rowData)
    if (missingRows.length > 0) {
      const modal = ixsdk.Widgets.showModalView({
        title: 'Email addresses missing',
        el: continueModalContent(missingRows),
        buttons: [{
          title: 'Go back',
          text: 'Go back',
          onClick() {
            modal.close()
          }
        }, {
          title: 'Continue',
          text: 'Continue',
          onClick() {
            modal.close()
            createComposeView()
          }
        }]
      })
    } else {
      createComposeView()
    }
    async function createComposeView() {
      onComposeCreated()
      const msg = ixsdk.ButterBar.showMessage({
        text: 'Creating email from spreadsheet.'
      })
      const cleanedData = removeMissingEmailRows(missingRows, rowData)
      console.log(cleanedData, rowData)
      const composeView = await ixsdk.Compose.openNewComposeView()
      // @ts-ignore
      msg.destroy()
      const placeholders = createAutocompleteVals(header)
      // set tribute collection values to the header names
      // @ts-ignore
      composeView.tribute.collection[0].values = placeholders
      // set custom tokens
      // @ts-ignore
      composeView.tokens = headerTokens
      // @ts-ignore
      composeView.customTokenData = customTokenData(headerTokens, cleanedData)
      // @ts-ignore
      composeView.customData = cleanedData
      console.log(emailIndex, cleanedData)
      composeView.setToRecipients(getEmails(emailIndex, cleanedData))
    }
  } catch (err) {
    onError(err.message)
    console.log(err)
  }
}

function getEmails(emailIndex: number, rowData: any[]) {
  return rowData.map((row) => {
    return row.values[emailIndex].formattedValue
  })
}

function removeMissingEmailRows(rowsToRemove: number[], data: any[]) {
  const dataCopy = data.slice()
  for (let index = rowsToRemove.length - 1; index >= 0; index--) {
    const row = rowsToRemove[index]
    dataCopy.splice(row, 1)
  }
  return dataCopy
}

/**
 * Returns empty cells for a given column of a given data set.
 *
 * @param {number} rowIndex
 * @param {any[]} rowData
 * @returns
 */
function missingEmailRows(rowIndex: number, data: any[]) {
  const missing = []
  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    if (!row.values || !row.values[rowIndex] || !row.values[rowIndex].formattedValue) {
      missing.push(index)
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
