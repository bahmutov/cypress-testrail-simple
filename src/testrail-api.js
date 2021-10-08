// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const { getAuthorization } = require('./get-config')

async function getTestRun(runId, testRailInfo) {
  const closeRunUrl = `${testRailInfo.host}/index.php?/api/v2/get_run/${runId}`
  debug('get run url: %s', closeRunUrl)
  const authorization = getAuthorization(testRailInfo)

  // @ts-ignore
  const json = await got(closeRunUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
  }).json()

  debug('get test run %d response', runId)
  debug(json)
  return json
}

async function closeTestRun(runId, testRailInfo) {
  console.log(
    'closing the TestRail run %d for project %s',
    runId,
    testRailInfo.projectId,
  )
  const closeRunUrl = `${testRailInfo.host}/index.php?/api/v2/close_run/${runId}`
  debug('close run url: %s', closeRunUrl)
  const authorization = getAuthorization(testRailInfo)

  // @ts-ignore
  const json = await got(closeRunUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    json: {
      name: 'Started run',
      description: 'Checking...',
    },
  }).json()

  debug('close test run response')
  debug(json)
  return json
}

module.exports = { getTestRun, closeTestRun }
