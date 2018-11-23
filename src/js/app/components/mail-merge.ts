import settings from '../../settings'
import { requestHeaders, createElement, addClass } from './utils'
import { InboxSDKInstance } from 'inboxsdk'

interface IFile {
  id: string,
  name: string
}

export default function mailMerge(sdk: InboxSDKInstance, googleToken: string) {
  const p = document.getElementById('aso_search_form_anchor').parentElement
  const btn = createElement('button')

  p.style.display = 'flex'
  addClass(btn, 'merge-btn')
  btn.innerText = 'Merge'
  btn.addEventListener('click', () => {
    const content = mergeModalContent(googleToken)
    sdk.Widgets.showModalView({
      el: content,
      title: 'Select Spreadsheet'
    })
  })
  p.appendChild(btn)
}

function mergeModalContent(googleToken: string) {
  const div = createElement('div')
  const load = loader()
  const url = `https://www.googleapis.com/drive/v3/files?key=${settings.googleApiKey}&q=mimeType='application/vnd.google-apps.spreadsheet'`
  fetch(url, {
    headers: requestHeaders(googleToken)
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
  const select = createElement('select')

  select.innerHTML = `
    ${files.map((f) => {
      return `<option value='${f.id}'>${f.name}</option>`
    }).join()}
  `
  btn.innerText = 'Create'
  div.append(select)
  div.append(btn)
  return div
}

function loader() {
  const div = createElement('div')
  div.innerText = 'Loading sheets from Google Drive...'
  return div
}
