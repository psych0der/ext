const keys = {
  firstTimeUser: 'first_time_user'
}

export function isFirstTimeUser(cb: (isFirstTime: boolean) => void) {
  chrome.storage.local.get(keys.firstTimeUser, (items) => {
    console.log(items)
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
