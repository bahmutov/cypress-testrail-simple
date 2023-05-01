#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-testrail-simple')

const args = arg(
  {
    '--case': String,
    // aliases
    '-c': '--case',
  },
  { permissive: false },
)
// optional arguments
debug('args: %o', args)

if (!args['--case']) {
  console.error('Missing --case argument')
  process.exit(1)
}

const caseId = args['--case'].startsWith('C')
  ? args['--case']
  : 'C' + args['--case']
console.log('looking for TestRail Case %s', caseId)
