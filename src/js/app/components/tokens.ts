export const defaultTokens = [
  'EmailAddress',
  'FirstName',
  'LastName',
  'FullName'
]

export function defaultTokenData(email: string, name: string) {
  const split = name.split(' ')
  const firstName = split[0]
  const lastName = split[1]

  return {
    EmailAddress: email,
    FirstName: firstName,
    FullName: name,
    LastName: lastName
  }
}

export function replaceTokens(tokenData: any, str: string): string {
  const reg = /\{(.[^\{]*?)\}/g
  let newStr = str
  let match = reg.exec(newStr)

  while (match !== null) {
    // right side of the split is the fallback
    // in case the token returns no result
    const split = match[1].split('|')
    const dflt = split[1]
    const tokenStr = split[0]
    const token = tokenData[tokenStr]

    if (token === undefined || token === '') {
      if (dflt !== undefined) {
        newStr = insertToken(newStr, dflt, match)
        reg.lastIndex = 0
      }
    } else {
      newStr = insertToken(newStr, token, match)
      reg.lastIndex = 0
    }
    match = reg.exec(newStr)
  }
  return newStr
}

function insertToken(str: string, token: string, match: RegExpMatchArray) {
  return str.substr(0, match.index) + token + str.substr(match.index + match[0].length)
}
