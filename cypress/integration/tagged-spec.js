/// <reference types="cypress" />
import { findCasesInSpec } from '../../src/find-cases'

describe('Finding test case IDs', () => {
  it('finds tagged tests', () => {
    const source = `
      it('C1 works', () => {
        cy.wait(15000)
      })

      describe('user tests', {tags: '@user'}, () => {
        it('C2002 works', () => {
          cy.wait(15000)
        })
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

      it('loads C99', {tags: '@user'})
    `
    const readFile = cy.stub().returns(source)
    const filename = 'test-spec.js'
    const ids = findCasesInSpec(filename, readFile, ['@user']).sort()
    expect(ids, 'test cases').to.deep.equal([2002, 99])
  })
})
