#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')
require('console.table')

async function getCases({ testRailInfo }) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    'fetching cases for TestRail project %s',
    testRailInfo.projectId,
  )

  // https://www.gurock.com/testrail/docs/api/reference/cases/#getcases
  const getCasesUrl = `${testRailInfo.host}/index.php?/api/v2/get_cases/${testRailInfo.projectId}&limit=250`
  debug('get cases url: %s', getCasesUrl)
  const authorization = getAuthorization(testRailInfo)

  // @ts-ignore
  return (
    got(getCasesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization,
      },
    })
      .json()
      .then(
        (json) => {
          debug('response from the get_cases')
          debug('%o', json)
          const { cases } = json
          const list = cases.map((c) => {
            return {
              id: c.id,
              title: c.title,
            }
          })
          return list
        },
        (error) => {
          console.error(
            'Could not get cases for TestRail project',
            testRailInfo.projectId,
          )
          console.error('Response: %s', error.name)
          console.error('Please check your TestRail configuration')
          process.exit(1)
        },
      )
      // make sure the test cases are sorted by ID
      .then((list) => {
        return list.sort((c1, c2) => c1.id - c2.id)
      })
  )
}

const testRailInfo = getTestRailConfig()
getCases({ testRailInfo }).then((list) => {
  console.table(list)
  console.log()
  console.log('%d cases found', list.length)
})
