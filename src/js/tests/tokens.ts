import { expect } from 'chai'
import { replaceTokens } from '../app/components/tokens';

describe('token tests', () => {
  it('replaces tokens from a string', () => {
    const tokenData = {
      'Age': 25,
      'FirstName': 'John'
    }
    const str = 'Hello {FirstName}. Are you {Age}?'
    const expected = 'Hello John. Are you 25?'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })

  it('uses defaults if token data unavail', () => {
    const tokenData = {}
    const str = 'Hello {FirstName|Mate}. Are you {Age|old}?'
    const expected = 'Hello Mate. Are you old?'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })

  it('uses defaults if tokens are empty string', () => {
    const tokenData = {
      'FirstName': ''
    }
    const str = 'Hello {FirstName|Mate}. Are you {Age|old}?'
    const expected = 'Hello Mate. Are you old?'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })

  it('skips broken token', () => {
    const tokenData = {
      'FirstName': 'Jim'
    }
    const str = 'Hello {FirstName|Mate. Are you {Age|old}?'
    const expected = 'Hello {FirstName|Mate. Are you old?'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })

  it('replace UTF8 chars in tokens', () => {
    const tokenData = {
      '✓à': 'Test'
    }
    const str = 'Hello {✓à}.'
    const expected = 'Hello Test.'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })
  it('replaces undefined UTF8 tokens with defaults', () => {
    const tokenData = {
      '✓à': ''
    }
    const str = 'Hello {✓à|Màte}.'
    const expected = 'Hello Màte.'
    expect(replaceTokens(tokenData, str)).to.eq(expected)
  })
})
