export type ITypes = ICheckAuth

export enum Type {
  CHECK_AUTH,
  GMAIL_SIGN_IN
}

export interface ICheckAuth {
  type: Type.CHECK_AUTH
}

export interface IGmailSignIn {
  type: Type.GMAIL_SIGN_IN
}
