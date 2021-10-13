#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const globby = require('globby')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')
const { findCases } = require('../src/find-cases')

const args = arg(
  {
    '--spec': String,
    '--name': String,
    '--description': String,
    // aliases
    '-s': '--spec',
    '-n': '--name',
    '-d': '--description',
  },
  { permissive: true },
)
// optional arguments
const name = args['--name'] || args._[0]
const description = args['--description'] || args._[1]
debug('args: %o', args)
debug('run name: %s', name)
debug('run description: %s', description)

const testRailInfo = getTestRailConfig()

function findSpecs(pattern) {
  // @ts-ignore
  return globby(pattern, {
    absolute: true,
  })
}

function startRun({ testRailInfo, name, description, caseIds }) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    'creating new TestRail run for project %s',
    testRailInfo.projectId,
  )
  const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`
  debug('add run url: %s', addRunUrl)
  const authorization = getAuthorization(testRailInfo)

  const json = {
    name,
    description,
  }
  if (caseIds && caseIds.length > 0) {
    json.case_ids = caseIds
  }

  // @ts-ignore
  return got(addRunUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    json,
  })
    .json()
    .then(
      (json) => {
        debug('response from the add_run')
        debug('%o', json)
        console.log(json.id)
      },
      (error) => {
        console.error(error)
        process.exit(1)
      },
    )
}

if (args['--spec']) {
  findSpecs(args['--spec']).then((specs) => {
    debug('using pattern "%s" found specs', args['--spec'])
    debug(specs)
    const caseIds = findCases(specs)
    debug('found TestRail case ids: %o', caseIds)

    startRun({ testRailInfo, name, description, caseIds })
  })
} else {
  // start a new test run for all test cases
  // @ts-ignore
  startRun({ testRailInfo, name, description })
}
