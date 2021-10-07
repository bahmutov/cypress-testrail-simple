/// <reference types="cypress" />

describe('parent', () => {
  // "context" is just an alias to "describe"
  // both used to group similar tests together
  context('inner', () => {
    // test rail case ID "1"
    it('C1 works', () => {
      cy.wait(1000)
    })
  })
})
