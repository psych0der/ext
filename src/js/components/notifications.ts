export function firstTime(onClickSignInBtn: () => void, onCloseNotif?: () => void) {
  chrome.notifications.create({
    buttons: [
      {
        title: 'Sign in'
      }
    ],
    iconUrl: './icons/icon.png',
    message: 'Thanks for installing EXT_NAME. To start, we first need access to your Gmail account.',
    title: 'Hi there!',
    type: 'basic'
  }, (notifId) => {
    removeNotifTimeout(notifId, 10000)
    onButtonClick(notifId, 0, onClickSignInBtn)
    if (onCloseNotif !== undefined) {
      onClose(notifId, onCloseNotif)
    }
  })
}

export function notAuthorized(onClickSignInBtn: () => void, onCloseNotif?: () => void) {
  chrome.notifications.create({
    buttons: [
      {
        title: 'Sign in'
      }
    ],
    iconUrl: './icons/icon.png',
    message: 'First we need access to your Gmail account!',
    title: 'Sign In To Continue!',
    type: 'basic'
  }, (notifId) => {
    removeNotifTimeout(notifId)
    onButtonClick(notifId, 0, onClickSignInBtn)
    if (onCloseNotif !== undefined) {
      onClose(notifId, onCloseNotif)
    }
  })
}

export function authFailed(onTryAgainClick: () => void, onCloseNotif?: () => void) {
  chrome.notifications.create({
        buttons: [
      {
        title: 'Click here to try again.'
      },
    ],
    iconUrl: './icons/icon.png',
    message: 'Access is required to use EXT_NAME. Would you like to try again?',
    title: 'Access Not Granted',
    type: 'basic',
  }, (notifId) => {
    removeNotifTimeout(notifId)
    onButtonClick(notifId, 0, onTryAgainClick)
    if (onCloseNotif !== undefined) {
      onClose(notifId, onCloseNotif)
    }
  })
}

export function authSuccess() {
  chrome.notifications.create({
    iconUrl: './icons/icon.png',
    message: 'You can now use the EXT_NAME extension.',
    title: 'Login Successful',
    type: 'basic'
  }, (notifId) => {
    removeNotifTimeout(notifId)
  })
}

function onClose(notifId: string, cb: () => void) {
  chrome.notifications.onClosed.addListener((id) => {
    if (id === notifId) {
      cb()
    }
  })
}

function onButtonClick(notifId: string, index: number, cb: () => void) {
  chrome.notifications.onButtonClicked.addListener((id, i) => {
    if (id === notifId && i === index) {
      cb()
    }
  })
}

function removeNotifTimeout(id: string, timeMs?: number) {
  setTimeout(() => {
    chrome.notifications.clear(id)
  }, timeMs !== undefined ? timeMs : 10000)
}
