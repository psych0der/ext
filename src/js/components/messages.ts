export type ITypes = ICheckAuth

export enum Type {
  CHECK_AUTH,
  GMAIL_SIGN_IN
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
