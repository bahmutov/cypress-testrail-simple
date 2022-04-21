#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const { getTestRunId, getTestRailConfig } = require('../src/get-config')
const { getTestRun, closeTestRun } = require('../src/testrail-api')

const args = arg(
  {
    '--run': Number,
    '--force': Boolean,
  },
  { permissive: true },
)

debug('arguments %o', args)

let runId

if (args['--run']) {
  runId = args['--run']
} else {
  const runIdStr = args._[0]
  if (!runIdStr) {
    debug('TestRail run id not passed via CLI, trying the file')
    runId = getTestRunId(null)
  } else {
    runId = parseInt(runIdStr, 10)
  }
}

if (!runId) {
  console.error('Usage: testrail-close-run.js --run <number runId> [--force]')
  console.error('or pass it in the file runId.txt')
  process.exit(1)
}

const force = process.argv[3] === '--force'

const testRailInfo = getTestRailConfig()
debug('test rail info with the password masked')
debug('%o', { ...testRailInfo, password: '<masked>' })

getTestRun(runId, testRailInfo).then((runInfo) => {
  if (runInfo.is_completed) {
    console.log('Run %d is already completed', runId)
    return
  }

  const allTestsDone = runInfo.untested_count === 0
  if (!allTestsDone) {
    console.log(
      'TestRail run %d still has %d untested cases',
      runId,
      runInfo.untested_count,
    )

    if (!force) {
      console.log('not closing the run...')
      return
    }
  }
  closeTestRun(runId, testRailInfo).then(
    (json) => {
      console.log('Closed run %d', json.id)
      console.log('name: %s', json.name)
      console.log('description: %s', json.description)
      console.log('passed tests: %d', json.passed_count)
      console.log('failed tests: %d', json.failed_count)
      console.log('blocked (pending) tests: %d', json.blocked_count)
      // untested count should be zero if all tests are done
      // or could be positive number if "--force" was used
      console.log('untested: %d', json.untested_count)
    },
    (error) => {
      // the error might be legit error, or the run was closed
      // while we were checking its status, let's try again
      return getTestRun(runId, testRailInfo).then((runInfo) => {
        if (runInfo.is_completed) {
          console.log('Run %d was already completed', runId)
          return
        }
        console.error('original message when trying to close the run')
        console.error(error)
        process.exit(1)
      })
    },
  )
})
