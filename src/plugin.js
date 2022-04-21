/// <reference types="cypress" />

// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const {
  hasConfig,
  getTestRailConfig,
  getAuthorization,
  getTestRunId,
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
function registerPlugin(on, config, skipPlugin = false) {
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
       *  | Passed         | Passed          | 1                  |
       *  | N/A            | Blocked         | 2                  |
       *  | Pending        | Untested        | 3                  |
       *  | Skipped        | Retest          | 4                  |
       *  | Failed         | Failed          | 5                  |
       */
      const defaultStatus = {
        passed: 1,
        pending: 3,
        skipped: 4,
        failed: 5,
      }
      // override status mapping if defined by user
      const statusOverride = testRailInfo.statusOverride
      const status = {
        ...defaultStatus,
        ...statusOverride,
      }
      const testRailCaseReg = /C(\d+)\s/
      // only look at the test name, not at the suite titles
      const testName = result.title[result.title.length - 1]
      if (testRailCaseReg.test(testName)) {
        const testRailResult = {
          case_id: parseInt(testRailCaseReg.exec(testName)[1]),
          status_id: status[result.state] || defaultStatus.failed,
        }
        testRailResults.push(testRailResult)
      }
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
