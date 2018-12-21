import * as messages from './components/messages'
import Popup from './app/popup'
import { render } from 'react-dom'
import { createElement } from 'react'

render(createElement(Popup), document.getElementById('app'))
