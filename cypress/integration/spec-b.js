/// <reference types="cypress" />

describe('parent2', { tags: '@real' }, () => {
  // "context" is just an alias to "describe"
  // both used to group similar tests together
  context('inner2', () => {
    // test rail case ID "15"
    it('C15 works', () => {
      cy.wait(15000)
      // uncomment to fail test
      // cy.wrap(false).should('be.true')
    })
  })

  it('tests C103 regression', { tags: '@regression' }, () => {
    cy.wait(10000)
  })
})
