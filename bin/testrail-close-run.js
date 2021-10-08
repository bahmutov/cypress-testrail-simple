#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const {
  getTestRunId,
  getTestRailConfig,
  getAuthorization,
} = require('../src/get-config')

let runId
const runIdStr = process.argv[2]
if (!runIdStr) {
  debug('TestRail run id not passed via CLI, trying the file')
  runId = getTestRunId()
} else {
  runId = parseInt(runIdStr, 10)
}

if (!runId) {
  console.error('Usage: testrail-close-run.js <number runId>')
  console.error('or pass it in the file runId.txt')
  process.exit(1)
}

const testRailInfo = getTestRailConfig()
debug('test rail info without the password')
debug('%o', { ...testRailInfo, password: '***' })

console.log(
  'closing the TestRail run %d for project %s',
  runId,
  testRailInfo.projectId,
)
const closeRunUrl = `${testRailInfo.host}/index.php?/api/v2/close_run/${runId}`
debug('close run url: %s', closeRunUrl)
const authorization = getAuthorization(testRailInfo)

// @ts-ignore
got(closeRunUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    authorization,
  },
  json: {
    name: 'Started run',
    description: 'Checking...',
  },
})
  .json()
  .then(
    (json) => {
      debug('response from the add_run')
      debug('%o', json)
      console.log('Closed run %d', json.id)
      console.log('name: %s', json.name)
      console.log('description: %s', json.description)
      console.log('passed tests: %d', json.passed_count)
      console.log('failed tests: %d', json.failed_count)
      console.log('untested: %d', json.untested_count)
    },
    (error) => {
      console.error(error)
      process.exit(1)
    },
  )
