// / <reference types="cypress" />

// @ts-check
const debug = require("debug")("cypress-testrail-simple")
const got = require("got")
const fs = require("fs")
const find = require("find")
const FormData = require("form-data")
const {
  hasConfig,
  getTestRailConfig,
  getAuthorization,
  getTestRunId,
} = require("../src/get-config")
const {
  testRailStatuses
} = require("../src/testRailStatuses")


const testRailInfo = getTestRailConfig()
const runId = getTestRunId()
const addResultsUrl = `${testRailInfo.host}/index.php?/api/v2/add_results_for_cases/${runId}`
const getResultsForCaseUrl = case_id => `${testRailInfo.host}/index.php?/api/v2/get_results_for_case/${runId}/${case_id}&limit=1`
const addAttachToResultUrl = result_id => `${testRailInfo.host}/index.php?/api/v2/add_attachment_to_result/${result_id}`
const authorization = getAuthorization(testRailInfo)
const statuses = {
  "passed": testRailStatuses.PASSED,
  "failed": testRailStatuses.FAILED,
  "pending": testRailStatuses.UNTESTED,
  "skipped": testRailStatuses.FAILED
}

async function sendTestResults(testResults) {
  debug(
      "sending %d test results to TestRail for run %d",
      testResults.length,
      runId,
  )

  // @ts-ignore
  const json = await got(addResultsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization,
    },
    json: {
      results: testResults,
    },
  }).json()
  const result = await attachScreenshots(testResults)

  debug("TestRail response: %o", json)
}
async function attachScreenshots(testResults){
  const failedTestsResults = testResults.filter(result => result.status_id === testRailStatuses.FAILED)

  for (const testResult of failedTestsResults){
    const caseId = testResult.case_id
    const caseResults = await got(getResultsForCaseUrl(caseId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization,
      }
    }).json()

    for (const result of caseResults.results){
      const resultId = result.id

      try {
        const files = find.fileSync("./cypress/screenshots/")
        const screenshots = files.filter(file => file.includes(`${caseId}`))

        for (const screenshot of screenshots){
          let form = new FormData()

          form.append("attachment", fs.createReadStream(`./${screenshot}`))

          const attachResponse = await got(addAttachToResultUrl(resultId), {
            method: "POST",
            headers: {
              authorization
            },
            body: form
          }).json()

        }
      } catch (err) {
        console.log("Error on adding screenshots", err)
      }
    }
  }
}
/**
 * Registers the cypress-testrail-simple plugin.
 * @example
 *  module.exports = (on, config) => {
 *   require('cypress-testrail-simple/src/plugin')(on)
 *  }
 * @example
 *  Skip the plugin
 *  module.exports = (on, config) => {
 *   require('cypress-testrail-simple/src/plugin')(on, true)
 *  }
 * @param {Cypress.PluginEvents} on Event registration function from Cypress
 * @param {Boolean} skipPlugin If true, skips loading the plugin. Defaults to false
 */
function registerPlugin(on, skipPlugin = false) {
  if (skipPlugin === true) {
    debug("the user explicitly disabled the plugin")

    return
  }
  if (!hasConfig(process.env)) {
    debug("cypress-testrail-simple env variables are not set")

    return
  }
  if (!runId) {
    throw new Error("Missing test rail run ID")
  }

  // should we ignore test results if running in the interactive mode?
  // right now these callbacks only happen in the non-interactive mode

  // https://on.cypress.io/after-spec-api
  on("after:spec", (spec, results) => {
    debug("after:spec")
    debug(spec)
    debug(results)

    // find only the tests with TestRail case id in the test name
    const testRailResults = []

    results.tests.forEach(result => {
      const testRailCaseReg = /C(\d+)\s/
      // only look at the test name, not at the suite titles
      const testName = result.title[result.title.length - 1]

      // TestRail doesn't accept result = Untested
      if (testRailCaseReg.test(testName) && result.state !== "pending") {
        const testRailResult = {
          case_id: parseInt(testRailCaseReg.exec(testName)[1]),
          status_id: statuses[result.state] || testRailStatuses.FAILED
        }
        if(testRailResult.status_id === testRailStatuses.FAILED){
          testRailResult.comment = getTestComments(result.displayError, result.body)
        }
        testRailResults.push(testRailResult)
      }
    })
    if (testRailResults.length) {
      console.log("TestRail results in %s", spec.relative)
      console.table(testRailResults, ["case_id", "status_id"])

      return sendTestResults(testRailResults)
    }
  })
}

function getTestComments (displayError, testBody){
  const logs = testBody.split("\n").filter(log =>  log.includes("cy.log")).map(log => log.trim()).join("\n")
  return `Error:
  ${displayError}
  Test body:
  ${logs}`
}

module.exports = registerPlugin
