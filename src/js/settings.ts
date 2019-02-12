const useLocalHost = false
export default {
  extensionName: 'Sendia',
  googleApiKey: 'AIzaSyCL8c8MbwiHdM2vV2oQdzwHle5RYL8HQ_M',
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
    domain: 'sendiateam.auth0.com',
    logo: 'https://landen.imgix.net/4yi0tmwcd15u/assets/1lsb0eoo.png?w=400'
  }
}
