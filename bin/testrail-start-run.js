#!/usr/bin/env node

// @ts-check

const fs = require('fs')
const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const globby = require('globby')
const findCypressSpecs = require('find-cypress-specs')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')
const { findCases } = require('../src/find-cases')
const { getTestSuite } = require('../src/testrail-api')

const args = arg(
  {
    '--spec': String,
    '--name': String,
    '--description': String,
    '--suite': String,
    // find the specs automatically using
    // https://github.com/bahmutov/find-cypress-specs
    '--find-specs': Boolean,
    // filter all found specs by the given tag(s)
    '--tagged': String,
    // do not open the test run, just find everything
    '--dry': Boolean,
    // aliases
    '-s': '--spec',
    '-n': '--name',
    '-d': '--description',
    '-st': '--suite',
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

async function startRun({ testRailInfo, name, description, caseIds }) {
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
    const uniqueCaseIds = [...new Set(caseIds)]
    if (uniqueCaseIds.length !== caseIds.length) {
      debug('Removed duplicate case IDs')
      debug('have %d case IDs', uniqueCaseIds.length)
    }
    json.include_all = false
    json.case_ids = uniqueCaseIds
  }
  debug('add run params %o', json)

  let suiteId = args['--suite'] || testRailInfo.suiteId
  if (suiteId) {
    // let the user pass the suite ID like the TestRail shows it "S..."
    // or just the number
    if (suiteId.startsWith('S')) {
      suiteId = suiteId.substring(1)
    }
    json.suite_id = Number(suiteId)
    debug('suite id %d', json.suite_id)
    // simply print all test cases
    await getTestSuite(suiteId, testRailInfo)
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
        console.error('Could not create a new TestRail run')
        console.error('Response: %s', error.name)
        console.error('Please check your TestRail configuration')
        if (json.case_ids) {
          console.error('and the case IDs: %s', json.case_ids)
        }
        process.exit(1)
      },
    )
}

if (args['--find-specs']) {
  const specs = findCypressSpecs.getSpecs()
  debug('found %d Cypress specs', specs.length)
  debug(specs)

  let tagged
  if (args['--tagged']) {
    tagged = args['--tagged']
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    debug('tagged: %o', tagged)
  }
  const caseIds = findCases(specs, fs.readFileSync, tagged)
  debug('found %d TestRail case ids: %o', caseIds.length, caseIds)

  if (args['--dry']) {
    console.log('Dry run, not starting a new run')
  } else {
    const testRailInfo = getTestRailConfig()
    startRun({ testRailInfo, name, description, caseIds })
  }
} else if (args['--spec']) {
  findSpecs(args['--spec']).then((specs) => {
    debug('using pattern "%s" found specs', args['--spec'])
    debug(specs)
    const caseIds = findCases(specs)
    debug('found %d TestRail case ids: %o', caseIds.length, caseIds)

    const testRailInfo = getTestRailConfig()
    startRun({ testRailInfo, name, description, caseIds })
  })
} else {
  const testRailInfo = getTestRailConfig()
  // start a new test run for all test cases
  // @ts-ignore
  startRun({ testRailInfo, name, description })
}
