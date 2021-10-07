#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')

// optional arguments
const name = process.argv[2]
const description = process.argv[3]

const testRailInfo = getTestRailConfig()

// only output the run ID to the STDOUT, everything else is logged to the STDERR
console.error(
  'creating new TestRail run for project %s',
  testRailInfo.projectId,
)
const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`
debug('add run url: %s', addRunUrl)
const authorization = getAuthorization(testRailInfo)
// @ts-ignore
got(addRunUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    authorization,
  },
  json: {
    name,
    description,
  },
})
  .json()
  .then(
    (json) => {
      debug('response from the close_run')
      debug('%o', json)
      console.log(json.id)
    },
    (error) => {
      console.error(error)
      process.exit(1)
    },
  )
