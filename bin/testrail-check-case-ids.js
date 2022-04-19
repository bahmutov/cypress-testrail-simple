#!/usr/bin/env node

// @ts-check

const fs = require('fs')
const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const findCypressSpecs = require('find-cypress-specs')

const { findCases } = require('../src/find-cases')
const { getTestRailConfig } = require('../src/get-config')
const { getProjectCases } = require('../src/get-project-cases')
require('console.table')

const args = arg(
  {
    // find the specs automatically using
    // https://github.com/bahmutov/find-cypress-specs
    '--find-specs': Boolean,
  },
  { permissive: true },
)
// optional arguments
debug('args: %o', args)

const testRailInfo = getTestRailConfig()
getProjectCases({ testRailInfo }).then((list) => {
  debug('TestRail has %d cases', list.length)
  if (args['--find-specs']) {
    const specs = findCypressSpecs.getSpecs()
    debug('found %d Cypress specs', specs.length)
    const caseIds = findCases(specs, fs.readFileSync)
    debug(
      'found %d TestRail case ids in spec files: %o',
      caseIds.length,
      caseIds,
    )

    const specFilesExtraIds = caseIds.filter((id) =>
      list.find((item) => item.id === id),
    )
    if (specFilesExtraIds.length) {
      console.error(
        'Found %d case IDs in the spec files NOT preset in the TestRail project',
        specFilesExtraIds.length,
      )
      console.error(specFilesExtraIds.join(', '))
    }
  } else {
    console.table(list)
    console.log()
    console.log('%d cases found', list.length)
  }
})
