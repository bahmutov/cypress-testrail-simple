/// <reference types="cypress" />
import { findCases, findCasesInSpec } from '../../src/find-cases'

describe('Finding test case IDs', () => {
  it('finds test IDs in a single spec', () => {
    const source = `
      it('C1 works', () => {
        cy.wait(15000)
      })

      it('C2002 works', () => {
        cy.wait(15000)
      })

      it('new case C199', () => {
        cy.wait(15000)
      })

      it(\`C123 \${testNameExtension}\`, () => {
        cy.wait(15000)
      })

      it(\`awesome C456 \${testNameExtension}\`, () => {
        cy.wait(15000)
      })
    `
    const readFile = cy.stub().returns(source)
    const filename = 'test-spec.js'
    const ids = findCasesInSpec(filename, readFile)
    expect(ids, 'test cases').to.deep.equal([1, 2002, 199, 123, 456])
    expect(readFile).to.be.calledOnceWithExactly(filename, 'utf8')
  })

  it('finds test IDs from all files', () => {
    const source1 = `
      it('C1 works', () => {
        cy.wait(15000)
      })
    `

    const source2 = `
      it('not test id', () => {
        cy.wait(15000)
      })
    `

    const source3 = `
      it('new case C199', () => {
        cy.wait(15000)
      })
    `

    const source4 = `
    it(\`C123 \${testNameExtension}\`, () => {
      cy.wait(15000)
    })
    `

    const readFile = cy.stub()
    readFile.withArgs('file1.js', 'utf8').returns(source1)
    readFile.withArgs('file2.js', 'utf8').returns(source2)
    readFile.withArgs('file3.js', 'utf8').returns(source3)
    readFile.withArgs('file4.js', 'utf8').returns(source4)
    const ids = findCases(['file1.js', 'file2.js', 'file3.js', 'file4.js'], readFile)
    expect(ids, 'test cases').to.deep.equal([1, 199, 123])
  })

  it('returns an empty list', () => {
    const source = `
      it('has no test id')
    `
    const readFile = cy.stub().returns(source)
    const filename = 'test-spec.js'
    const ids = findCasesInSpec(filename, readFile)
    expect(ids, 'test cases').to.deep.equal([])
  })

  it('ignores stray Cs', () => {
    const source = `
      // some link /foo/C1
      // another linke C2/
    `
    const readFile = cy.stub().returns(source)
    const filename = 'test-spec.js'
    const ids = findCasesInSpec(filename, readFile)
    expect(ids, 'test cases').to.deep.equal([])
  })

  it('can be in different quotes', () => {
    const source = `
      "C1"
      'C2'
      \`C3\`
    `
    const readFile = cy.stub().returns(source)
    const filename = 'test-spec.js'
    const ids = findCasesInSpec(filename, readFile)
    expect(ids, 'test cases').to.deep.equal([1, 2, 3])
  })
})
