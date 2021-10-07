// @ts-check
function hasConfig(env = process.env) {
  return (
    'TESTRAIL_HOST' in env ||
    'TESTRAIL_USERNAME' in env ||
    'TESTRAIL_PASSWORD' in env ||
    'TESTRAIL_PROJECTID' in env
  )
}

function getTestRailConfig(env = process.env) {
  const debug = require('debug')('cypress-testrail-simple')
  const got = require('got')

  if (!process.env.TESTRAIL_HOST) {
    throw new Error('TESTRAIL_HOST is required')
  }
  if (!process.env.TESTRAIL_USERNAME) {
    throw new Error('TESTRAIL_USERNAME is required')
  }
  if (!process.env.TESTRAIL_PASSWORD) {
    throw new Error('TESTRAIL_PASSWORD is required. Could be an API key.')
  }
  if (!process.env.TESTRAIL_PROJECTID) {
    throw new Error('TESTRAIL_PROJECTID is required.')
  }

  const testRailInfo = {
    host: process.env.TESTRAIL_HOST,
    username: process.env.TESTRAIL_USERNAME,
    password: process.env.TESTRAIL_PASSWORD,
    projectId: process.env.TESTRAIL_PROJECTID,
  }
  debug('test rail info without the password')
  debug('%o', { ...testRailInfo, password: '***' })

  return testRailInfo
}

function getAuthorization(testRailInfo) {
  const authorization = `Basic ${Buffer.from(
    `${testRailInfo.username}:${testRailInfo.password}`,
  ).toString('base64')}`
  return authorization
}

module.exports = { hasConfig, getTestRailConfig, getAuthorization }
