#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const got = require('got')

if (!process.env.TESTRAIL_HOST) {
  throw new Error('TESTRAIL_HOST is required')
}
if (!process.env.TESTRAIL_USERNAME) {
  throw new Error('TESTRAIL_USERNAME is required')
}
if (!process.env.TESTRAIL_PASSWORD) {
  throw new Error('TESTRAIL_PASSWORD is required. Could be an API key.')
}
if (!process.env.TESTRAIL_PROJECTID) {
  throw new Error('TESTRAIL_PROJECTID is required.')
}

const testRailInfo = {
  host: process.env.TESTRAIL_HOST,
  username: process.env.TESTRAIL_USERNAME,
  password: process.env.TESTRAIL_PASSWORD,
  projectId: process.env.TESTRAIL_PROJECTID,
}
debug('test rail info without the password')
debug('%o', { ...testRailInfo, password: '***' })

console.log('creatig new TestRail run for project %s', testRailInfo.projectId)
const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`
debug('add run url: %s', addRunUrl)
const authorization = `Basic ${Buffer.from(
  `${testRailInfo.username}:${testRailInfo.password}`,
).toString('base64')}`
// @ts-ignore
got(addRunUrl, {
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
      // we are only interested in the run id
      if (!json.id) {
        console.error(json)
        throw new Error('no id in the response')
      }
      console.log(json.id)
    },
    (error) => {
      console.error(error)
      process.exit(1)
    },
  )
