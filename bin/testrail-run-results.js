#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const { getTestRunId, getTestRailConfig } = require('../src/get-config')
const { getTestRunResults } = require('../src/testrail-api')
require('console.table')

const args = arg(
  {
    '--run': Number,
  },
  { permissive: true },
)

debug('arguments %o', args)

let runId

if (args['--run']) {
  runId = args['--run']
} else {
  const runIdStr = args._[0]
  if (!runIdStr) {
    debug('TestRail run id not passed via CLI, trying the file')
    runId = getTestRunId(null)
  } else {
    runId = parseInt(runIdStr, 10)
  }
}

if (!runId) {
  console.error('Usage: testrail-run-results.js --run <number runId>')
  console.error('or pass it in the file runId.txt')
  process.exit(1)
}

const testRailInfo = getTestRailConfig()
debug('test rail info with the password masked')
debug('%o', { ...testRailInfo, password: '<masked>' })

getTestRunResults(runId, testRailInfo).then((cases) => {
  console.table(cases)
  console.log()
  console.log('TestRail run %d has %d case(s)', runId, cases.length)
})
