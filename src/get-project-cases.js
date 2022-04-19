// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const { getAuthorization } = require('./get-config')
const got = require('got')

/**
 * Given a TestRail project, finds all test case IDs in the project.
 * If there are many test cases, fetches them in batches and returns
 * a combined list, sorted by ID.
 */
async function getProjectCases({ testRailInfo }) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    'fetching cases for TestRail project %s',
    testRailInfo.projectId,
  )

  const testRailApi = `${testRailInfo.host}/index.php?`
  debug('testRailApi', testRailApi)

  // https://www.gurock.com/testrail/docs/api/reference/cases/#getcases
  const getCasesUrl = `/api/v2/get_cases/${testRailInfo.projectId}&limit=200`
  debug('get cases url: %s', getCasesUrl)
  const authorization = getAuthorization(testRailInfo)

  // we will store the result in this list
  const allCases = []

  async function getCasesPart(url) {
    // @ts-ignore
    const json = await got(testRailApi + url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization,
      },
    }).json()

    debug('response from the get_cases')
    debug('%o', json)
    const { cases } = json
    const list = cases.map((c) => {
      return {
        id: c.id,
        title: c.title,
      }
    })
    allCases.push(...list)

    if (json._links && json._links.next) {
      await getCasesPart(json._links.next)
    }
  }

  await getCasesPart(getCasesUrl)

  // make sure the test cases are sorted by ID
  allCases.sort((c1, c2) => c1.id - c2.id)

  return allCases
}

module.exports = { getProjectCases }
