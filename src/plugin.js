// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const {
  hasConfig,
  getTestRailConfig,
  getAuthorization,
} = require('../src/get-config')

async function sendTestResults(testRailInfo, runId, testResults) {
  debug(
    'sending %d test results to TestRail for run %d',
    testResults.length,
    runId,
  )
  const addResultsUrl = `${testRailInfo.host}/index.php?/api/v2/add_results_for_cases/${runId}`
  const authorization = getAuthorization(testRailInfo)

  // @ts-ignore
  const json = await got(addResultsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    json: {
      results: testResults,
    },
  }).json()

  debug('TestRail response: %o', json)
}

function registerPlugin(on, config) {
  if (!hasConfig(process.env)) {
    debug('cypress-testrail-simple env variables are not set')
    return
  }

  const testRailInfo = getTestRailConfig()
  if (!process.env.TESTRAIL_RUN_ID) {
    throw new Error('Missing test rail id TESTRAIL_RUN_ID')
  }

  const runId = parseInt(process.env.TESTRAIL_RUN_ID)

  // should we ignore test results if running in the interactive mode?
  // right now these callbacks only happen in the non-interactive mode

  // https://on.cypress.io/after-spec-api
  on('after:spec', (spec, results) => {
    debug('after:spec')
    debug(spec)
    debug(results)

    // find only the tests with TestRail case id in the test name
    const testRailResults = []
    results.tests.forEach((result) => {
      const testRailCaseReg = /C(\d+)\s/
      // only look at the test name, not at the suite titles
      const testName = result.title[result.title.length - 1]
      if (testRailCaseReg.test(testName)) {
        const testRailResult = {
          case_id: parseInt(testRailCaseReg.exec(testName)[1]),
          // TestRail status
          // Passed = 1,
          // Blocked = 2,
          // Untested = 3,
          // Retest = 4,
          // Failed = 5,
          // TODO: map all Cypress test states into TestRail status
          // https://glebbahmutov.com/blog/cypress-test-statuses/
          status_id: result.state === 'passed' ? 1 : 5,
        }
        testRailResults.push(testRailResult)
      }
    })
    if (testRailResults.length) {
      console.log('TestRail results in %s', spec.relative)
      console.table(testRailResults)
      return sendTestResults(testRailInfo, runId, testRailResults)
    }
  })
}

module.exports = registerPlugin
