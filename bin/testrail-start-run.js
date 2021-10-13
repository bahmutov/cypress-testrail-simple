#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')
const got = require('got')
const globby = require('globby')
const { getTestRailConfig, getAuthorization } = require('../src/get-config')

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

function startRun(testRailInfo, name, description) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    'creating new TestRail run for project %s',
    testRailInfo.projectId,
  )
  const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`
  debug('add run url: %s', addRunUrl)
  const authorization = getAuthorization(testRailInfo)
  // @ts-ignore
  return got(addRunUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    json: {
      name,
      description,
    },
  }).json()
}

if (args['--spec']) {
  findSpecs(args['--spec']).then((specs) => {
    debug('using pattern "%s" found specs', args['--spec'])
    debug(specs)
  })
} else {
  startRun(testRailInfo, name, description).then(
    (json) => {
      debug('response from the close_run')
      debug('%o', json)
      console.log(json.id)
    },
    (error) => {
      console.error(error)
      process.exit(1)
    },
  )
}
