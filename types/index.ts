interface ILabel {
  id: string,
  name: string
}
interface ILabels {
  [name: string]: ILabel
}
interface IAuth0 {
  activeSubscription: boolean,
  auth0Token: string,
  isLoggedIn: boolean
}
