#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const { getTestRailConfig } = require('../src/get-config')
const { getProjectCases } = require('../src/get-project-cases')
require('console.table')

const testRailInfo = getTestRailConfig()
getProjectCases({ testRailInfo }).then((list) => {
  console.table(list)
  console.log()
  console.log('%d cases found', list.length)
})
