# cypress-testrail-simple
[![cypress-testrail-simple](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/41cgid/main&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/41cgid/runs) [![ci](https://github.com/bahmutov/cypress-testrail-simple/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bahmutov/cypress-testrail-simple/actions/workflows/ci.yml) [![CircleCI](https://circleci.com/gh/bahmutov/cypress-testrail-simple/tree/main.svg?style=svg)](https://circleci.com/gh/bahmutov/cypress-testrail-simple/tree/main) ![cypress version](https://img.shields.io/badge/cypress-8.5.0-brightgreen)
> Simple upload of Cypress test results to TestRail

## Install

Add this plugin as a dev dependency

```
# If using NPM
$ npm i -D cypress-testrail-simple
# If using Yarn
$ yarn add -D cypress-testrail-simple
```

Add the plugin to your Cypress plugin file

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  // https://github.com/bahmutov/cypress-testrail-simple
  require('cypress-testrail-simple/src/plugin')(on, config)
}
```

## Environment variables

When running the Cypress tests on CI, you need to provide the TestRail server variables through the environment variables. The following variables should be set:

```
TESTRAIL_HOST=
TESTRAIL_USERNAME=
; the user password or API key for the user
; API key is preferred
TESTRAIL_PASSWORD=
; Note: the project ID is not very sensitive value
TESTRAIL_PROJECTID=
```

## Debugging

This tool uses [debug](https://github.com/visionmedia/debug#readme) to output verbose logs. To see the logs, run it with environment variable `DEBUG=cypress-testrail-simple`.

## Why?

Because [cypress-testrail-reporter](https://github.com/Vivify-Ideas/cypress-testrail-reporter) is broken in a variety of ways and does not let me open issues to report the problems.
