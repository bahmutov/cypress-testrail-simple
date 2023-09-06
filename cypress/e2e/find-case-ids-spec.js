/// <reference types="cypress" />
import { getTestCases } from '../../src/find-cases'

describe('getTestCases', () => {
  it('returns an undefined without test cases in the title', () => {
    expect(getTestCases('hello world')).to.deep.equal([])
  })

  it('returns a single number', () => {
    expect(getTestCases('hello C101 world')).to.deep.equal([101])
  })

  it('finds several test case IDs', () => {
    expect(getTestCases('hello C101 world C202')).to.deep.equal([101, 202])
  })

  it('finds case IDs at the start and the end', () => {
    expect(getTestCases('C101 hello world C202')).to.deep.equal([101, 202])
  })

  it('removes duplicates', () => {
    expect(getTestCases('C101 hello C101 world C202 C202')).to.deep.equal([
      101, 202,
    ])
  })
})
