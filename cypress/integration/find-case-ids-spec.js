/// <reference types="cypress" />
import { getTestCases } from '../../src/find-cases'

describe('getTestCases', () => {
  it('returns an undefined without test cases in the title', () => {
    expect(getTestCases('hello world')).to.equal(undefined)
  })

  it('returns a single number', () => {
    expect(getTestCases('hello C101 world')).to.equal(101)
  })
})
