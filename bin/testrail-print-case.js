#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const { getTestRailConfig } = require('../src/get-config')
const { getCase } = require('../src/get-case')

const args = arg(
  {
    '--case': String,
    // aliases
    '-c': '--case',
  },
  { permissive: false },
)
// optional arguments
debug('args: %o', args)

if (!args['--case']) {
  console.error('Missing --case argument')
  process.exit(1)
}

// remove leading "C" from the test case ID
const caseId = args['--case'].startsWith('C')
  ? args['--case'].slice(1)
  : args['--case']
console.log('looking for TestRail Case %s', caseId)

const testRailInfo = getTestRailConfig()

getCase({ testRailInfo, caseId })
  .then((info) => {
    console.log(info)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
