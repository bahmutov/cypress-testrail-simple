const fs = require('fs')
const { getTestNames } = require('find-test-names')

/**
 * Finds the test case IDs in the test titles.
 * @example "C101: Test case title" => "101"
 */
function findCasesInSpec(spec, readSpec = fs.readFileSync) {
  const source = readSpec(spec, 'utf8')

  const found = getTestNames(source)
  // a single test case ID per test title for now
  const ids = found.testNames
    .map((testName) => {
      const matches = testName.match(/\bC(?<caseId>\d+)\b/)
      if (!matches) {
        return
      }
      return Number(matches.groups.caseId)
    })
    .filter((id) => !isNaN(id))

  // make sure the test ids are unique
  return Array.from(new Set(ids))
}

function findCases(specs, readSpec = fs.readFileSync) {
  // find case Ids in each spec and flatten into a single array
  const allCaseIds = specs
    .map((spec) => findCasesInSpec(spec, readSpec))
    .reduce((a, b) => a.concat(b), [])
    .filter((id) => !isNaN(id))
  const uniqueCaseIds = Array.from(new Set(allCaseIds))
  return uniqueCaseIds
}

module.exports = { findCases, findCasesInSpec }
