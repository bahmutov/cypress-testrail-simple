/// <reference types="cypress" />

// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const {
  hasConfig,
  getTestRailConfig,
  getAuthorization,
  getTestRunId,
} = require('./get-config')
const { getCasesInTestRun } = require('./testrail-api')
const { getTestCases } = require('./find-cases')

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

/**
 * Registers the cypress-testrail-simple plugin.
 * @example
 *  module.exports = (on, config) => {
 *   require('cypress-testrail-simple/src/plugin')(on, config)
 *  }
 * @example
 *  Skip the plugin
 *  module.exports = (on, config) => {
 *   require('cypress-testrail-simple/src/plugin')(on, config, true)
 *  }
 * @param {Cypress.PluginEvents} on Event registration function from Cypress
 * @param {Cypress.PluginConfigOptions} config Cypress configuration object
 * @param {Boolean} skipPlugin If true, skips loading the plugin. Defaults to false
 */
async function registerPlugin(on, config, skipPlugin = false) {
  if (skipPlugin === true) {
    debug('the user explicitly disabled the plugin')
    return
  }

  if (!hasConfig(process.env)) {
    debug('cypress-testrail-simple env variables are not set')
    return
  }

  const testRailInfo = getTestRailConfig()
  const runId = getTestRunId(config)
  if (!runId) {
    throw new Error('Missing test rail run ID')
  }

  const caseIds = await getCasesInTestRun(runId, testRailInfo)
  debug('test run %d has %d cases', runId, caseIds.length)
  debug(caseIds)

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
      /**
       *  Cypress to TestRail Status Mapping
       *
       *  | Cypress status | TestRail Status | TestRail Status ID |
       *  | -------------- | --------------- | ------------------ |
       *  | created        | Untested        | 3                  |
       *  | Passed         | Passed          | 1                  |
       *  | Pending        | Blocked         | 2                  |
       *  | Skipped        | Retest          | 4                  |
       *  | Failed         | Failed          | 5                  |
       *
       *  Each test starts as "Untested" in TestRail.
       *  @see https://glebbahmutov.com/blog/cypress-test-statuses/
       */
      const defaultStatus = {
        passed: 1,
        pending: 2,
        skipped: 4,
        failed: 5,
      }
      // override status mapping if defined by user
      const statusOverride = testRailInfo.statusOverride
      const status = {
        ...defaultStatus,
        ...statusOverride,
      }
      // only look at the test name, not at the suite titles
      const testName = result.title[result.title.length - 1]
      // there might be multiple test case IDs per test title
      const testCaseIds = getTestCases(testName)
      testCaseIds.forEach((case_id) => {
        const status_id = status[result.state] || defaultStatus.failed
        const testRailResult = {
          case_id,
          status_id,
        }

        if (caseIds.length && !caseIds.includes(case_id)) {
          debug('case %d is not in test run %d', case_id, runId)
        } else {
          testRailResults.push(testRailResult)
        }
      })
    })
    if (testRailResults.length) {
      console.log('TestRail results in %s', spec.relative)
      console.table(testRailResults)
      return sendTestResults(testRailInfo, runId, testRailResults).catch(
        (err) => {
          console.error('Error sending TestRail results')
          console.error(err)
        },
      )
    }
  })
}

module.exports = registerPlugin
