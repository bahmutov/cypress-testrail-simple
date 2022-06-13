/// <reference types="cypress" />

// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const fs = require('fs')
const find = require('find')
const FormData = require('form-data')
const {
  hasConfig,
  getTestRailConfig,
  getAuthorization,
  getTestRunId,
} = require('./get-config')
const { getCasesInTestRun } = require('./testrail-api')

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

async function sendTestResults(testRailInfo, runId, testRailResults) {
  const authorization = getAuthorization(testRailInfo)
  const addResultsUrl = `${testRailInfo.host}/index.php?/api/v2/add_results_for_cases/${runId}`

  debug(
      'sending %d test results to TestRail for run %d',
      testRailResults.length,
      runId,
  )

  // @ts-ignore
  const json = await got(addResultsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    json: {
      results: testRailResults,
    },
  }).json()
  const result = await attachScreenshots(testRailInfo, runId, testRailResults)

  debug('TestRail response: %o', json)
}

const getResultsForCaseUrl = (host, runId, caseId) =>
    `${host}/index.php?/api/v2/get_results_for_case/${runId}/${caseId}&limit=1`
const addAttachToResultUrl = (host, resultId) =>
    `${host}/index.php?/api/v2/add_attachment_to_result/${resultId}`

async function attachScreenshots(testRailInfo, runId, testRailResults) {
  const authorization = getAuthorization(testRailInfo)
  const failedTestsResults = testRailResults.filter(
      (result) => result.status_id === defaultStatus.failed,
  )

  for (const testResult of failedTestsResults) {
    const caseId = testResult.case_id
    const caseResults = await got(getResultsForCaseUrl(testRailInfo.host, runId, caseId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization,
      },
    }).json()

    for (const result of caseResults.results) {
      const resultId = result.id

      try {
        const files = find.fileSync('./cypress/screenshots/')
        const screenshots = files.filter((file) => file.includes(`${caseId}`))

        for (const screenshot of screenshots) {
          const body = new FormData()

          body.append('attachment', fs.createReadStream(`./${screenshot}`))

          await got(addAttachToResultUrl(testRailInfo.host, resultId), {
            method: 'POST',
            headers: {
              authorization,
            },
            body,
          }).json()
        }
      } catch (err) {
        console.log('Error on adding screenshots', err)
      }
    }
  }
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
        const case_id = parseInt(testRailCaseReg.exec(testName)[1])
        const status_id = status[result.state] || defaultStatus.failed
        const testRailResult = {
          case_id,
          status_id,
        }

        if (caseIds.length && !caseIds.includes(case_id)) {
          debug('case %d is not in test run %d', case_id, runId)
        } else {
          if (testRailResult.status_id === defaultStatus.failed ) {
            testRailResult.comment = getTestComments(case_id, result.displayError)
          }
          testRailResults.push(testRailResult)
        }
      }
    })
    if (testRailResults.length) {
      console.log('TestRail results in %s', spec.relative)
      console.table(testRailResults, ['case_id', 'status_id'])

      return sendTestResults(testRailInfo, runId, testRailResults).catch(
          (err) => {
            console.error('Error sending TestRail results')
            console.error(err)
          },
      )
    }
  })
}
function getTestComments(caseId, displayError) {
  try {
    const files = find.fileSync('./cypress/logs/')
    const logs = files.find((file) => file.includes(`${caseId}`))
    const contents = fs.readFileSync(logs)
    const jsonContent = JSON.parse(contents)
    const comment = jsonContent.testCommands.join('\r\n')

    return formatComment(displayError, comment)
  } catch (err) {
    console.log('Error on adding screenshots', err.message)
    return formatComment(displayError)
  }
}

function formatComment(displayError, comment = '') {
  return `${comment}
  ${displayError}`
}

module.exports = registerPlugin
