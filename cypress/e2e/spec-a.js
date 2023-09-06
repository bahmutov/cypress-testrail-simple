/// <reference types="cypress" />

describe('parent', () => {
  // "context" is just an alias to "describe"
  // both used to group similar tests together
  context('inner', { tags: '@a' }, () => {
    // test rail case ID "1"
    it.skip('C1 works', { tags: '@real' }, () => {
      cy.wait(15000)
    })
  })
})
