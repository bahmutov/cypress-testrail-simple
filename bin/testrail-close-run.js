#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const { getTestRunId, getTestRailConfig } = require('../src/get-config')
const { closeTestRun } = require('../src/testrail-api')

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

closeTestRun(runId, testRailInfo).then(
  (json) => {
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
