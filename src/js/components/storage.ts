const keys = {
  firstTimeEmail: 'first_time_email',
  firstTimeUser: 'first_time_user'
}

export function isFirstTimeUser(cb: (isFirstTime: boolean) => void) {
  chrome.storage.local.get(keys.firstTimeUser, (items) => {
    if (items[keys.firstTimeUser] === undefined) {
      cb(true)
      chrome.storage.local.set({
        [keys.firstTimeUser]: false
      })
    } else {
      cb(false)
    }
  })
}

export function hasFirstTimeEmailSent(cb: (hasSent: boolean) => void) {
  chrome.storage.local.get(keys.firstTimeEmail, (items) => {
    console.log(items)
    const val = items[keys.firstTimeEmail]
    if (val === undefined) {
      cb(false)
      chrome.storage.local.set({
        [keys.firstTimeEmail]: false
      })
    } else {
      cb(val)
    }
  })
}

export function firstTimeEmailSent() {
  chrome.storage.local.set({
    [keys.firstTimeEmail]: true
  }, () => {
    //
  })
}
