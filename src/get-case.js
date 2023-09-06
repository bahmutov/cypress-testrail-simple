// @ts-check
const debug = require('debug')('cypress-testrail-simple')
const { getAuthorization } = require('./get-config')
const got = require('got')

async function getCase({ testRailInfo, caseId }) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    'fetching cases for TestRail project %s',
    testRailInfo.projectId,
  )

  const testRailApi = `${testRailInfo.host}/index.php?`
  debug('testRailApi', testRailApi)

  const getCasesUrl = `/api/v2/get_case/${caseId}`

  debug('get case %s url: %s', caseId, getCasesUrl)
  const authorization = getAuthorization(testRailInfo)

  // @ts-ignore
  const json = await got(testRailApi + getCasesUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
  }).json()

  return json
}

module.exports = { getCase }
