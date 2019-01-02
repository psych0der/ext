const useLocalHost = false
export default {
  extensionName: 'Sendia',
  googleApiKey: 'AIzaSyCC1m58oVvPminiAqiZmKeaRd_yljDk9s0',
  inboxSDK: 'sdk_gmclone_e228e1960f',
  host: useLocalHost ? 'http://localhost:3000' : 'https://sendia.us',
  homePage: 'http://sendia.co',
  contactEmail: 'sendiateam@gmail.com',
  maxEmailSendInterval: 500, // at most one email per this time(ms)
  labels: {
    reports: {
      id: null,
      name: 'Sendia Reports'
    }
  } as ILabels,
  auth0: {
    clientId: 'pfthfYGxF7eyDpS844ZJ3yce9QbD9lfN',
    domain: 'sendiateam.auth0.com'
  }
}
