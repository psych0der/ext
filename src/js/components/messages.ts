export type ITypes = ICheckAuth | IGmailSignIn | IClearToken | IAuth0SignIn |
  IAuth0LoggedIn | IAuth0SignOut

export enum Type {
  CHECK_AUTH, // for gmail API
  GMAIL_SIGN_IN,
  CLEAR_TOKEN, // clears gmail token
  AUTH0_SIGN_IN,
  AUTH0_SIGN_OUT,
  AUTH0_LOGGED_IN
}

export interface ICheckAuth {
  type: Type.CHECK_AUTH
}

export interface ICheckAuthResponse {
  token: string,
  email: string,
  userId: string
}

export interface IGmailSignIn {
  type: Type.GMAIL_SIGN_IN
}

export interface IClearToken {
  type: Type.CLEAR_TOKEN,
  token: string
}

export interface IAuth0SignIn {
  type: Type.AUTH0_SIGN_IN
}

export interface IAuth0LoggedIn {
  type: Type.AUTH0_LOGGED_IN
}

export interface IAuth0SignOut {
  type: Type.AUTH0_SIGN_OUT
}
