#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const globby = require('globby')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')
const { findCases } = require('../src/find-cases')
const { getTestSuite } = require('../src/testrail-api')

const args = arg(
  {
    '--spec': String,
    '--name': String,
    '--description': String,
		'--suite': String,
    // aliases
    '-s': '--spec',
    '-n': '--name',
    '-d': '--description',
		'-st': '--suite'
  },
  { permissive: true },
)
// optional arguments
const name = args['--name'] || args._[0]
const description = args['--description'] || args._[1]
debug('args: %o', args)
debug('run name: %s', name)
debug('run description: %s', description)

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
  if (caseIds && caseIds.length > 0) {
    console.error('With %d case IDs', caseIds.length)
  }

  const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`
  debug('add run url: %s', addRunUrl)
  const authorization = getAuthorization(testRailInfo)

  const json = {
    name,
    description,
  }
  if (caseIds && caseIds.length > 0) {
    json.include_all = false
    json.case_ids = caseIds
  }
  debug('add run params %o', json)

	const suiteId = args['--suite'] || testRailInfo.suiteId
	if (suiteId) {
		json.suite_id = +suiteId
		getTestSuite(suiteId, testRailInfo)
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

    const testRailInfo = getTestRailConfig()
    startRun({ testRailInfo, name, description, caseIds })
  })
} else {
  const testRailInfo = getTestRailConfig()
  // start a new test run for all test cases
  // @ts-ignore
  startRun({ testRailInfo, name, description })
}